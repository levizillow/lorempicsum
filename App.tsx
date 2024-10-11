import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, FlatList, Dimensions, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { Modal, TouchableWithoutFeedback, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');
const imageWidth = width;
const imageHeight = (600 / 900) * width; // Maintain aspect ratio

interface ImageItem {
  id: string;
  uri: string;
  photographer: string;
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

function LoadingIndicator() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="medium" color="#1A1A1A" />
    </View>
  );
}

function ImageList() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImageAndPhotographer = async (index: number): Promise<ImageItem> => {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const response = await fetch(`https://picsum.photos/900/600?random=${randomNumber}`);
    const imageUrl = response.url;
    const id = imageUrl.split('/')[4];
    const infoResponse = await fetch(`https://picsum.photos/id/${id}/info`);
    const infoData = await infoResponse.json();
    return {
      id: `image-${index}`,
      uri: `https://picsum.photos/id/${id}/900/600`,
      photographer: infoData.author,
    };
  };

  const fetchImages = async () => {
    try {
      const imagePromises = Array.from({ length: 10 }, (_, i) => fetchImageAndPhotographer(i));
      const newImages = await Promise.all(imagePromises);
      setImages(newImages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching images:', error);
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ImageItem }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item.uri }} style={styles.image} />
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

  const handleFilterPress = () => {
    setBottomSheetVisible(true);
  };

  const handleBottomSheetClose = () => {
    setBottomSheetVisible(false);
  };

  const titleBarHeight = 60; // Adjust this value to match your title bar height
  const topInset = Platform.OS === 'ios' ? titleBarHeight : insets.top + titleBarHeight;

  const bottomInset = Math.max(insets.bottom || 0, 0); // Ensure it's always a non-negative number

  return (
    <View style={styles.container}>
      <TitleBar onFilterPress={handleFilterPress} />
      <ImageList />
      <BottomSheet 
        visible={bottomSheetVisible} 
        onClose={handleBottomSheetClose} 
        topInset={topInset}
        bottomInset={bottomInset}
      />
    </View>
  );
}

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  topInset: number;
  bottomInset: number; // Add this prop
}

const SHEET_HEIGHT = 300;

const BottomSheet: React.FC<BottomSheetProps> = ({ visible, onClose, topInset, bottomInset }) => {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Ensure bottomInset is a valid number
  const safeBottomInset = isNaN(bottomInset) ? 0 : Math.max(bottomInset, 0);
  const totalHeight = SHEET_HEIGHT + safeBottomInset;

  useEffect(() => {
    if (visible) {
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
  }, [visible, totalHeight]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, totalHeight],
    outputRange: [0, totalHeight],
    extrapolate: 'clamp',
  });

  if (!visible && fadeAnim._value === 0) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
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
              height: totalHeight,
              paddingBottom: safeBottomInset,
            }
          ]}
        >
          <TouchableWithoutFeedback>
            <View style={styles.bottomSheetContent}>
              {/* Content of the bottom sheet goes here */}
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

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
    paddingTop: 10,  // Add some padding at the top of the list
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Lighter background (was 0.6)
    paddingVertical: 4, // Slightly reduced vertical padding
    paddingHorizontal: 8, // Slightly reduced horizontal padding
    borderRadius: 16, // Adjusted for smaller text
  },
  photographerText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12, // Reduced from 16 to 12
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
});

export default function App() {
  const [fontLoaded, setFontLoaded] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

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

  const toggleBottomSheet = () => {
    setBottomSheetVisible(!bottomSheetVisible);
  };

  if (!fontLoaded) {
    return <LoadingIndicator />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.container} edges={['right', 'left', 'top']}>
        <AppContent />
        <BottomSheet visible={bottomSheetVisible} onClose={() => setBottomSheetVisible(false)} topInset={60} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
