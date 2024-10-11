import React, { useState, useEffect } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, FlatList, Dimensions, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Font from 'expo-font';

const { width } = Dimensions.get('window');
const imageWidth = width;
const imageHeight = (600 / 900) * width; // Maintain aspect ratio

interface ImageItem {
  id: string;
  uri: string;
  photographer: string;
}

function TitleBar() {
  return (
    <View style={styles.titleBar}>
      <Text style={styles.titleText}>Proto Photo</Text>
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
    return <ActivityIndicator size="large" color="#0000ff" />;
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

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <TitleBar />
      <ImageList />
    </View>
  );
}

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
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.container} edges={['right', 'left', 'top']}>
        <TitleBar />
        <View style={styles.contentContainer}>
          <ImageList />
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
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
});