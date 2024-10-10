import React, { useState, useEffect } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, FlatList, Dimensions, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, ScreenStack, ScreenStackHeaderConfig } from 'react-native-screens';

const { width, height } = Dimensions.get('window');
const imageWidth = width;
const imageHeight = (600 / 900) * width; // Maintain aspect ratio

interface ImageItem {
  id: string;
  uri: string;
}

function ImageList() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

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
      contentContainerStyle={[
        styles.listContainer,
        { paddingTop: Platform.OS === 'ios' ? 0 : 56 } // Add padding for Android
      ]}
      contentInset={{ top: insets.top + (Platform.OS === 'ios' ? 44 : 56) }}
      contentOffset={{ x: 0, y: -(insets.top + (Platform.OS === 'ios' ? 44 : 56)) }}
      style={styles.list}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ScreenStack style={styles.container}>
        <Screen style={styles.screen}>
          <ScreenStackHeaderConfig
            title="Lorem Picsum"
            titleFontWeight="bold"
            statusBarStyle="dark"
            statusBarAnimation="fade"
            statusBarHidden={false}
            translucent={true}  // This is key for showing content under the status bar
            backgroundColor="#FFFFFF"  // Set this to match your header color
          />
          <ImageList />
        </Screen>
      </ScreenStack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 20, // Add some padding at the bottom for better UX
  },
  image: {
    width: imageWidth,
    height: imageHeight,
    marginBottom: 10,
  },
});