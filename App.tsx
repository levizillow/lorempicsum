import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, FlatList, Dimensions, StatusBar, TouchableOpacity, Platform, TextInput, Switch, Keyboard, RefreshControl, Animated, Easing } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { Modal, TouchableWithoutFeedback } from 'react-native';
import Slider from '@react-native-community/slider';

const { width } = Dimensions.get('window');
const imageWidth = width;
const imageHeight = (600 / 900) * width;

const screenWidth = Dimensions.get('window').width;

function calculateScaledDimensions(originalWidth: number, originalHeight: number): { width: number, height: number } {
  const aspectRatio = originalHeight / originalWidth;
  const scaledWidth = screenWidth;
  const scaledHeight = scaledWidth * aspectRatio;
  return { width: scaledWidth, height: scaledHeight };
}

interface ImageItem {
  id: string;
  uri: string;
  photographer: string;
  width: number;
  height: number;
}

function LoadingIndicator() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1A1A1A" />
    </View>
  );
}

function TitleBar({ onFilterPress }) {
  return (
    <View style={styles.titleBar}>
      <Text style={styles.titleText}>Proto Photo</Text>
      <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
        <Ionicons name="options-outline" size={24} color="#1A1A1A" />
      </TouchableOpacity>
    </View>
  );
}

function ImageList({ images, loading, imageDimensions, onRefresh }) {
  const [animatedImages, setAnimatedImages] = useState(images);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading && images.length === 0) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.in(Easing.cubic), // Starts slow, finishes fast
        useNativeDriver: true,
      }).start(() => {
        setAnimatedImages([]);
      });
    } else if (!loading) {
      setAnimatedImages(images);
      slideAnim.setValue(0);
    }
  }, [loading, images]);

  const renderItem = ({ item, index }: { item: ImageItem; index: number }) => (
    <Animated.View
      style={[
        styles.imageContainer,
        {
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Dimensions.get('window').height],
              }),
            },
          ],
        },
      ]}
    >
      <Image 
        source={{ uri: item.uri }} 
        style={[styles.image, { width: item.width, height: item.height }]}
      />
      <View style={styles.photographerPill}>
        <Text style={styles.photographerText}>{item.photographer}</Text>
      </View>
    </Animated.View>
  );

  if (loading && animatedImages.length === 0) {
    return <LoadingIndicator />;
  }

  return (
    <FlatList
      data={animatedImages}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          tintColor="#1A1A1A"
        />
      }
    />
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 900, height: 600 });
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [blurIntensity, setBlurIntensity] = useState(0);
  const [isGreyscale, setIsGreyscale] = useState(false);

  const refreshImages = useCallback(async (newDimensions?: { width: number; height: number }, newBlurIntensity?: number, newIsGreyscale?: boolean) => {
    setLoading(true);
    setImages([]);
    
    const dimensions = newDimensions || imageDimensions;
    const blurSetting = newBlurIntensity !== undefined ? newBlurIntensity : blurIntensity;
    const greyscaleSetting = newIsGreyscale !== undefined ? newIsGreyscale : isGreyscale;
    
    try {
      const newImages = await Promise.all(
        Array.from({ length: 10 }, (_, i) => fetchImageAndPhotographer(i, dimensions, blurSetting, greyscaleSetting))
      );
      setImages(newImages);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  }, [imageDimensions, blurIntensity, isGreyscale]);

  const fetchImageAndPhotographer = async (index: number, dimensions: { width: number; height: number }, blur: number, greyscale: boolean): Promise<ImageItem> => {
    const { width, height } = dimensions;
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const blurParam = blur > 0 ? `&blur=${blur}` : '';
    const greyscaleParam = greyscale ? '&grayscale' : '';
    const response = await fetch(`https://picsum.photos/${width}/${height}?random=${randomNumber}${blurParam}${greyscaleParam}`);
    const imageUrl = response.url;
    const id = imageUrl.split('/')[4];
    const infoResponse = await fetch(`https://picsum.photos/id/${id}/info`);
    const infoData = await infoResponse.json();
    const scaledDimensions = calculateScaledDimensions(width, height);
    return {
      id: `image-${index}`,
      uri: `https://picsum.photos/id/${id}/${width}/${height}${blur > 0 ? `?blur=${blur}` : ''}${greyscale ? (blur > 0 ? '&' : '?') + 'grayscale' : ''}`,
      photographer: infoData.author,
      width: scaledDimensions.width,
      height: scaledDimensions.height,
    };
  };

  useEffect(() => {
    refreshImages();
  }, [refreshImages]);

  const handleFilterPress = () => {
    setBottomSheetVisible(true);
  };

  const handleBottomSheetClose = (newDimensions?: { width: number; height: number }, newBlurIntensity?: number, newIsGreyscale?: boolean) => {
    setBottomSheetVisible(false);
    if (newDimensions || newBlurIntensity !== undefined || newIsGreyscale !== undefined) {
      if (newDimensions) {
        setImageDimensions(newDimensions);
      }
      if (newBlurIntensity !== undefined) {
        setBlurIntensity(newBlurIntensity);
      }
      if (newIsGreyscale !== undefined) {
        setIsGreyscale(newIsGreyscale);
      }
      refreshImages(newDimensions || imageDimensions, newBlurIntensity, newIsGreyscale);
    }
  };

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setImages([]);
    refreshImages();
  }, [refreshImages]);

  const titleBarHeight = 60;
  const topInset = Platform.OS === 'ios' ? titleBarHeight : titleBarHeight;
  const bottomInset = Math.max(insets.bottom || 0, 0);

  return (
    <View style={styles.container}>
      <TitleBar onFilterPress={handleFilterPress} />
      <View style={styles.contentContainer}>
        <ImageList images={images} loading={loading} imageDimensions={imageDimensions} onRefresh={handleRefresh} />
      </View>
      <BottomSheet 
        visible={bottomSheetVisible} 
        onClose={handleBottomSheetClose} 
        topInset={topInset}
        bottomInset={bottomInset}
        currentDimensions={imageDimensions}
        blurIntensity={blurIntensity}
        isGreyscale={isGreyscale}
      />
    </View>
  );
}

interface BottomSheetProps {
  visible: boolean;
  onClose: (newDimensions?: { width: number; height: number }, newBlurIntensity?: number, newIsGreyscale?: boolean) => void;
  topInset: number;
  bottomInset: number;
  currentDimensions: { width: number; height: number };
  blurIntensity: number;
  isGreyscale: boolean;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ visible, onClose, topInset, bottomInset, currentDimensions, blurIntensity, isGreyscale }) => {
  const [contentHeight, setContentHeight] = useState(0);
  const slideAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(currentDimensions.width.toString());
  const [height, setHeight] = useState(currentDimensions.height.toString());
  const [localBlurIntensity, setLocalBlurIntensity] = useState(blurIntensity);
  const [localIsGreyscale, setLocalIsGreyscale] = useState(isGreyscale);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [widthError, setWidthError] = useState('');
  const [heightError, setHeightError] = useState('');

  const safeBottomInset = isNaN(bottomInset) ? 0 : Math.max(bottomInset, 0);
  const totalHeight = contentHeight + safeBottomInset;

  useEffect(() => {
    const keyboardWillShow = (e: KeyboardEvent) => {
      if (Platform.OS === 'ios') {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    };

    const keyboardWillHide = () => {
      if (Platform.OS === 'ios') {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    };

    const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', keyboardWillShow);
    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', keyboardWillHide);

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setWidth(currentDimensions.width.toString());
      setHeight(currentDimensions.height.toString());
      setLocalBlurIntensity(blurIntensity);
      setLocalIsGreyscale(isGreyscale);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, totalHeight, currentDimensions, blurIntensity, isGreyscale]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      Platform.OS === 'ios' ? (isKeyboardVisible ? -keyboardHeight : 0) : 0,
      totalHeight
    ],
    extrapolate: 'clamp',
  });

  const handleDone = () => {
    Keyboard.dismiss();
    const { isValid, widthError: newWidthError, heightError: newHeightError } = validateDimensions(width, height);
    
    setWidthError(newWidthError);
    setHeightError(newHeightError);

    if (isValid) {
      const newWidth = parseInt(width);
      const newHeight = parseInt(height);
      if (newWidth !== currentDimensions.width || newHeight !== currentDimensions.height || localBlurIntensity !== blurIntensity || localIsGreyscale !== isGreyscale) {
        onClose({ width: newWidth, height: newHeight }, localBlurIntensity, localIsGreyscale);
      } else {
        onClose();
      }
    }
  };

  const handleContentPress = () => {
    if (isInputFocused) {
      Keyboard.dismiss();
      setIsInputFocused(false);
    }
  };

  const validateDimensions = (newWidth: string, newHeight: string): { isValid: boolean, widthError: string, heightError: string } => {
    const widthNum = parseInt(newWidth);
    const heightNum = parseInt(newHeight);
    
    let widthError = '';
    let heightError = '';

    if (isNaN(widthNum) || widthNum < 100 || widthNum > 1000) {
      widthError = 'Width must be between 100 and 1000';
    }
    if (isNaN(heightNum) || heightNum < 100 || heightNum > 1000) {
      heightError = 'Height must be between 100 and 1000';
    }

    return {
      isValid: !widthError && !heightError,
      widthError,
      heightError
    };
  };

  return (
    <TouchableWithoutFeedback onPress={() => onClose()}>
      <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
        <Animated.View 
          style={[
            styles.overlay,
            { 
              opacity: fadeAnim,
              top: topInset,
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.bottomSheet,
            { 
              transform: [{ translateY }],
            }
          ]}
        >
          <TouchableWithoutFeedback onPress={handleContentPress}>
            <View 
              style={[styles.bottomSheetContent, { paddingBottom: safeBottomInset }]}
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                setContentHeight(height);
              }}
            >
              <View style={styles.contentPadding}>
                <View style={styles.dimensionsContainer}>
                  <View style={styles.dimensionsRow}>
                    <Text style={styles.dimensionsLabel}>Dimensions</Text>
                    <View style={styles.inputsRow}>
                      <TextInput
                        style={[styles.input, widthError ? styles.inputError : null]}
                        keyboardType="numeric"
                        value={width}
                        onChangeText={setWidth}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                      />
                      <Text style={styles.xLabel}>x</Text>
                      <TextInput
                        style={[styles.input, heightError ? styles.inputError : null]}
                        keyboardType="numeric"
                        value={height}
                        onChangeText={setHeight}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                      />
                    </View>
                  </View>
                  {(widthError || heightError) && (
                    <Text style={styles.errorText}>
                      {widthError || heightError}
                    </Text>
                  )}
                </View>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>Blur</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={10}
                    step={1}
                    value={localBlurIntensity}
                    onValueChange={setLocalBlurIntensity}
                  />
                </View>
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleLabel}>Greyscale</Text>
                  <Switch value={localIsGreyscale} onValueChange={setLocalIsGreyscale} />
                </View>
              </View>
              <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default function App() {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
        'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
      });
      setFontLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontLoaded) {
    return <LoadingIndicator />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.container} edges={['right', 'left', 'top']}>
        <AppContent />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
  },
  titleBar: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
  },
  titleText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#1A1A1A',
  },
  listContainer: {
    paddingBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  image: {
    width: imageWidth,
    height: imageHeight,
  },
  photographerPill: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  photographerText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingTop: 20, // Adjust this value to position the indicator below the title bar
    alignItems: 'center',
  },
  filterButton: {
    padding: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetContent: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  dimensionsContainer: {
    marginBottom: 20, // Space between dimensions section and greyscale toggle
  },
  dimensionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5, // Small space between the inputs and potential error message
  },
  dimensionsLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#1A1A1A',
    marginRight: 10, // Space between label and inputs
  },
  inputsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // This will push the inputs to the right
  },
  input: {
    width: 70, // Set fixed width to 200px
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    padding: 8,
    textAlign: 'center',
  },
  inputError: {
    borderColor: 'red',
  },
  xLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#1A1A1A',
    marginHorizontal: 8,
  },
  errorText: {
    fontFamily: 'Poppins-Regular',
    color: 'red',
    fontSize: 12,
    marginTop: 5, // Space between inputs and error message
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#1A1A1A',
  },
  doneButton: {
    backgroundColor: '#1A1A1A',
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: Platform.OS === 'ios' ? 0 : 20,
    borderRadius: 10,
  },
  doneButtonText: {
    color: 'white',
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sliderLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#1A1A1A',
    width: 50, // You can adjust this value as needed
  },
  slider: {
    flex: 1,
    marginLeft: 10,
  },
});