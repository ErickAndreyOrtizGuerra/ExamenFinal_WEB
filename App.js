import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Función para obtener las fotos de la API
  const fetchPhotos = async () => {
    try {
      const response = await fetch('https://picsum.photos/v2/list');
      const data = await response.json();
      setPhotos(data);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error al obtener las fotos:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Función para refrescar la lista
  const onRefresh = () => {
    setRefreshing(true);
    fetchPhotos();
  };

  // Función para abrir el modal con la foto seleccionada
  const openPhotoDetail = (photo) => {
    setSelectedPhoto(photo);
    setModalVisible(true);
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedPhoto(null);
  };

  // Renderizar cada foto en la galería
  const renderPhotoItem = ({ item }) => (
    <TouchableOpacity
      style={styles.photoCard}
      onPress={() => openPhotoDetail(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: `https://picsum.photos/id/${item.id}/400/400` }}
        style={styles.photoImage}
        resizeMode="cover"
      />
      <View style={styles.photoOverlay}>
        <Text style={styles.photoAuthor} numberOfLines={1}>
          📸 {item.author}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Cargando galería...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#6366f1" />
      <ExpoStatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📷 Galería de Fotos</Text>
        <Text style={styles.headerSubtitle}>
          {photos.length} fotos disponibles
        </Text>
      </View>

      {/* Lista de fotos */}
      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.photoList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366f1']}
            tintColor="#6366f1"
          />
        }
      />

      {/* Modal para ver detalles de la foto */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeModal}
          >
            <View style={styles.modalContent}>
              {selectedPhoto && (
                <ScrollView
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Image
                    source={{
                      uri: `https://picsum.photos/id/${selectedPhoto.id}/800/800`,
                    }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                  
                  <View style={styles.modalInfo}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>👤 Autor:</Text>
                      <Text style={styles.infoValue}>{selectedPhoto.author}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>🆔 ID:</Text>
                      <Text style={styles.infoValue}>{selectedPhoto.id}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>📐 Dimensiones:</Text>
                      <Text style={styles.infoValue}>
                        {selectedPhoto.width} x {selectedPhoto.height}
                      </Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>🔗 URL:</Text>
                      <Text style={styles.infoValueSmall} numberOfLines={1}>
                        {selectedPhoto.url}
                      </Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>📥 Descargar:</Text>
                      <Text style={styles.infoValueSmall} numberOfLines={1}>
                        {selectedPhoto.download_url}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={closeModal}
                  >
                    <Text style={styles.closeButtonText}>✕ Cerrar</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#6366f1',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    fontWeight: '500',
  },
  photoList: {
    padding: 16,
  },
  photoCard: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    margin: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  photoAuthor: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalScrollContent: {
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f1f5f9',
  },
  modalInfo: {
    width: '100%',
    padding: 20,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  infoValueSmall: {
    fontSize: 12,
    color: '#64748b',
  },
  closeButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
