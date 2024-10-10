import React, { useState, useEffect } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, FlatList, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const imageWidth = width;
const imageHeight = (600 / 900) * width; // Maintain aspect ratio

interface ImageItem {
  id: string;
  uri: string;
}

export default function App() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = () => {
    const newImages: ImageItem[] = Array.from({ length: 10 }, (_, i) => {
      const randomNumber = Math.floor(1000 + Math.random() * 9000); // Generate random 4-digit number
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

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={images}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingVertical: 10,
  },
  image: {
    width: imageWidth,
    height: imageHeight,
    marginBottom: 10,
  },
});