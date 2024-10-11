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

  const fetchImages = () => {
    const newImages: ImageItem[] = Array.from({ length: 10 }, (_, i) => {
      const randomNumber = Math.floor(1000 + Math.random() * 9000);
      return {
        id: `image-${i}`,
        uri: `https://picsum.photos/900/600?random=${randomNumber}`
      };
    });
    setImages(newImages);
    setLoading(false);
  };

  const renderItem = ({ item }: { item: ImageItem }) => (
    <Image source={{ uri: item.uri }} style={styles.image} />
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
    async function loadFont() {
      await Font.loadAsync({
        'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
      });
      setFontLoaded(true);
    }
    loadFont();
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
    color: '#1A1A1A', // This sets the color to a darker shade
  },
  listContainer: {
    // Remove paddingTop: 10,
    paddingBottom: 20,
  },
  image: {
    width: imageWidth,
    height: imageHeight,
    marginBottom: 10,
  },
});