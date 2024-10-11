import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, FlatList, Dimensions, StatusBar, TouchableOpacity, Platform, TextInput, Switch, Keyboard } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { Modal, TouchableWithoutFeedback, Animated } from 'react-native';

const { width } = Dimensions.get('window');
const imageWidth = width;
const imageHeight = (600 / 900) * width;

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

function ImageList({ imageDimensions, onImagesFetched }) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    fetchImages();
  }, [imageDimensions]);

  const fetchImageAndPhotographer = async (index: number): Promise<ImageItem> => {
    const { width, height } = imageDimensions;
    const aspectRatio = width / height;
    const scaledHeight = screenWidth / aspectRatio;

    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const response = await fetch(`https://picsum.photos/${width}/${height}?random=${randomNumber}`);
    const imageUrl = response.url;
    const id = imageUrl.split('/')[4];
    const infoResponse = await fetch(`https://picsum.photos/id/${id}/info`);
    const infoData = await infoResponse.json();
    return {
      id: `image-${index}`,
      uri: `https://picsum.photos/id/${id}/${width}/${height}`,
      photographer: infoData.author,
      width: screenWidth,
      height: scaledHeight,
    };
  };

  const fetchImages = async () => {
    try {
      const imagePromises = Array.from({ length: 10 }, (_, i) => fetchImageAndPhotographer(i));
      const newImages = await Promise.all(imagePromises);
      setImages(newImages);
      setLoading(false);
      onImagesFetched();
    } catch (error) {
      console.error('Error fetching images:', error);
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ImageItem }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item.uri }} style={[styles.image, { width: item.width, height: item.height }]} />
      <View style={styles.photographerPill}>
        <Text style={styles.photographerText}>{item.photographer}</Text>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <FlatList
      data={images}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
    />
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 900, height: 600 });
  const [isLoading, setIsLoading] = useState(false);

  const handleFilterPress = () => {
    setBottomSheetVisible(true);
  };

  const handleBottomSheetClose = (newDimensions) => {
    setBottomSheetVisible(false);
    if (newDimensions) {
      setImageDimensions(newDimensions);
      setIsLoading(true);
    }
  };

  const handleImagesFetched = () => {
    setIsLoading(false);
  };

  const titleBarHeight = 60;
  const topInset = Platform.OS === 'ios' ? titleBarHeight : insets.top + titleBarHeight;
  const bottomInset = Math.max(insets.bottom || 0, 0);

  return (
    <View style={styles.container}>
      <TitleBar onFilterPress={handleFilterPress} />
      <View style={styles.contentContainer}>
        {isLoading ? (
          <LoadingIndicator />
        ) : (
          <ImageList imageDimensions={imageDimensions} onImagesFetched={handleImagesFetched} />
        )}
      </View>
      <BottomSheet 
        visible={bottomSheetVisible} 
        onClose={handleBottomSheetClose} 
        topInset={topInset}
        bottomInset={bottomInset}
        currentDimensions={imageDimensions}
      />
    </View>
  );
}

interface BottomSheetProps {
  visible: boolean;
  onClose: (newDimensions?: { width: number; height: number }) => void;
  topInset: number;
  bottomInset: number;
  currentDimensions: { width: number; height: number };
}

const BottomSheet: React.FC<BottomSheetProps> = ({ visible, onClose, topInset, bottomInset, currentDimensions }) => {
  const [contentHeight, setContentHeight] = useState(0);
  const slideAnim = useRef(new Animated.Value(contentHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(currentDimensions.width.toString());
  const [height, setHeight] = useState(currentDimensions.height.toString());
  const [isGreyscale, setIsGreyscale] = useState(false);
  const [isBlur, setIsBlur] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const safeBottomInset = isNaN(bottomInset) ? 0 : Math.max(bottomInset, 0);
  const totalHeight = contentHeight + safeBottomInset;

  useEffect(() => {
    if (visible) {
      setWidth(currentDimensions.width.toString());
      setHeight(currentDimensions.height.toString());
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
          toValue: totalHeight,
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
  }, [visible, totalHeight, currentDimensions]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, totalHeight],
    outputRange: [0, totalHeight],
    extrapolate: 'clamp',
  });

  const handleDone = () => {
    Keyboard.dismiss();
    setIsInputFocused(false);
    const newWidth = parseInt(width);
    const newHeight = parseInt(height);
    if (!isNaN(newWidth) && !isNaN(newHeight) && (newWidth !== currentDimensions.width || newHeight !== currentDimensions.height)) {
      onClose({ width: newWidth, height: newHeight });
    } else {
      onClose();
    }
  };

  if (!visible && fadeAnim._value === 0) return null;

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
              paddingBottom: safeBottomInset,
            }
          ]}
        >
          <TouchableWithoutFeedback onPress={() => {
            if (isInputFocused) {
              Keyboard.dismiss();
              setIsInputFocused(false);
            }
          }}>
            <View 
              style={styles.bottomSheetContent}
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                setContentHeight(height);
              }}
            >
              <View style={styles.contentPadding}>
                <View style={styles.dimensionsContainer}>
                  <Text style={styles.dimensionsLabel}>Dimensions</Text>
                  <View style={styles.inputsRow}>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={width}
                      onChangeText={setWidth}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                    />
                    <Text style={styles.xLabel}>x</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={height}
                      onChangeText={setHeight}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                    />
                  </View>
                </View>
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleLabel}>Greyscale</Text>
                  <Switch
                    value={isGreyscale}
                    onValueChange={setIsGreyscale}
                  />
                </View>
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleLabel}>Blur</Text>
                  <Switch
                    value={isBlur}
                    onValueChange={setIsBlur}
                  />
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
    paddingTop: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dimensionsLabel: {
    fontSize: 16,
    color: '#1A1A1A',
    marginRight: 10,
  },
  inputsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    padding: 8,
    textAlign: 'center',
  },
  xLabel: {
    fontSize: 16,
    color: '#1A1A1A',
    marginHorizontal: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  doneButton: {
    backgroundColor: '#1A1A1A',
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});