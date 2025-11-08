import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

// Paleta de colores profesionales y elegantes
const CARD_COLORS = [
  ['#2C3E50', '#34495E'], // Azul marino oscuro
  ['#16A085', '#1ABC9C'], // Verde esmeralda
  ['#2980B9', '#3498DB'], // Azul profesional
  ['#8E44AD', '#9B59B6'], // Púrpura elegante
  ['#2C3E50', '#7F8C8D'], // Gris carbón
  ['#27AE60', '#2ECC71'], // Verde corporativo
  ['#D35400', '#E67E22'], // Naranja profesional
  ['#34495E', '#5D6D7E'], // Gris azulado
];

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Refs para animaciones
  const scrollY = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0)).current;

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

  // Función para abrir el modal con animación
  const openPhotoDetail = (photo) => {
    setSelectedPhoto(photo);
    setModalVisible(true);
    Animated.spring(modalScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  // Función para cerrar el modal con animación
  const closeModal = () => {
    Animated.timing(modalScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedPhoto(null);
    });
  };

  // Componente de tarjeta animada
  const AnimatedPhotoCard = ({ item, index }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pressAnim = useRef(new Animated.Value(1)).current;
    
    const gradientColors = CARD_COLORS[index % CARD_COLORS.length];
    const aspectRatio = item.width / item.height;
    
    useEffect(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    const handlePressIn = () => {
      Animated.spring(pressAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(pressAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };
    
    return (
      <Animated.View
        style={[
          styles.photoCard,
          {
            opacity: fadeAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, pressAnim) },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => openPhotoDetail(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={{ flex: 1 }}
        >
          {!imageLoaded && (
            <View style={styles.skeletonLoader}>
              <ActivityIndicator size="small" color="#2C3E50" />
            </View>
          )}
          <Image
            source={{ uri: `https://picsum.photos/id/${item.id}/400/400` }}
            style={styles.photoImage}
            resizeMode="cover"
            onLoad={() => setImageLoaded(true)}
          />
          <LinearGradient
            colors={[...gradientColors, 'transparent']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.photoGradient}
          />
          <View style={styles.photoOverlay}>
            <View style={styles.authorBadge}>
              <Text style={styles.photoAuthor} numberOfLines={1}>
                {item.author}
              </Text>
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.idBadge}>
                <Text style={styles.photoId}>ID: {item.id}</Text>
              </View>
              <View style={styles.ratioBadge}>
                <Text style={styles.ratioText}>{aspectRatio.toFixed(1)}:1</Text>
              </View>
            </View>
          </View>
          <View style={styles.resolutionBadge}>
            <Text style={styles.resolutionText}>
              {item.width}×{item.height}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Renderizar cada foto
  const renderPhotoItem = ({ item, index }) => (
    <AnimatedPhotoCard item={item} index={index} />
  );

  if (loading) {
    return (
      <LinearGradient
        colors={['#2C3E50', '#34495E', '#2C3E50']}
        style={styles.loadingContainer}
      >
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Cargando galería profesional...</Text>
        </View>
      </LinearGradient>
    );
  }

  // Parallax effect para el header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [120, 85],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent />
      <ExpoStatusBar style="light" />
      
      {/* Header profesional con parallax */}
      <Animated.View style={[styles.headerWrapper, { height: headerHeight }]}>
        <LinearGradient
          colors={['#2C3E50', '#34495E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
            <View style={styles.titleContainer}>
              <View style={styles.titleRow}>
                <View style={styles.decorativeLine} />
                <Text style={styles.headerEmoji}>📷</Text>
                <View style={styles.decorativeLine} />
              </View>
              <Text style={styles.headerTitle}>Galería Profesional</Text>
              <View style={styles.infoRow}>
                <Text style={styles.headerSubtitle}>{photos.length} fotos</Text>
                <View style={styles.dot} />
                <Text style={styles.headerAuthor}>Erick Ortiz</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Lista de fotos */}
      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.photoList}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2C3E50']}
            tintColor="#2C3E50"
          />
        }
      />

      {/* Modal para ver detalles de la foto con blur */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={closeModal}
            >
              <Animated.View 
                style={[
                  styles.modalContent,
                  {
                    transform: [{ scale: modalScale }],
                  },
                ]}
              >
              {selectedPhoto && (
                <ScrollView
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.modalImageContainer}>
                    <Image
                      source={{
                        uri: `https://picsum.photos/id/${selectedPhoto.id}/800/800`,
                      }}
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(44, 62, 80, 0.95)']}
                      style={styles.modalImageGradient}
                    >
                      <Text style={styles.modalImageTitle}>
                        {selectedPhoto.author}
                      </Text>
                      <Text style={styles.modalImageSubtitle}>
                        Fotógrafo Profesional
                      </Text>
                    </LinearGradient>
                  </View>
                  
                  <View style={styles.modalInfo}>
                    <View style={styles.infoCard}>
                      <LinearGradient
                        colors={['#2980B9', '#3498DB']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.infoCardGradient}
                      >
                        <Text style={styles.infoEmoji}>🆔</Text>
                        <Text style={styles.infoCardLabel}>Identificador</Text>
                        <Text style={styles.infoCardValue}>{selectedPhoto.id}</Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.infoCard}>
                      <LinearGradient
                        colors={['#16A085', '#1ABC9C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.infoCardGradient}
                      >
                        <Text style={styles.infoEmoji}>📐</Text>
                        <Text style={styles.infoCardLabel}>Resolución</Text>
                        <Text style={styles.infoCardValue}>
                          {selectedPhoto.width} × {selectedPhoto.height}
                        </Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.infoFullCard}>
                      <View style={styles.infoFullRow}>
                        <Text style={styles.infoFullLabel}>🔗 Enlace Original</Text>
                        <Text style={styles.infoFullValue} numberOfLines={2}>
                          {selectedPhoto.url}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoFullCard}>
                      <View style={styles.infoFullRow}>
                        <Text style={styles.infoFullLabel}>📥 Enlace de Descarga</Text>
                        <Text style={styles.infoFullValue} numberOfLines={2}>
                          {selectedPhoto.download_url}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.closeButtonWrapper}
                    onPress={closeModal}
                  >
                    <LinearGradient
                      colors={['#2C3E50', '#34495E']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.closeButton}
                    >
                      <Text style={styles.closeButtonText}>Cerrar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollView>
              )}
              </Animated.View>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECF0F1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 40,
    borderRadius: 30,
    backdropFilter: 'blur(10px)',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flex: 1,
    paddingTop: 55,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#2C3E50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  headerContent: {
    alignItems: 'center',
    width: '100%',
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  decorativeLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 12,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#ECF0F1',
    fontWeight: '600',
    opacity: 0.9,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  headerAuthor: {
    fontSize: 12,
    color: '#ECF0F1',
    fontWeight: '500',
    opacity: 0.9,
  },
  photoList: {
    padding: 16,
    paddingBottom: 30,
  },
  photoCard: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH + 20,
    margin: 8,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  skeletonLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E1E8ED',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flex: 1,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  photoAuthor: {
    color: '#1e293b',
    fontSize: 11,
    fontWeight: '700',
  },
  idBadge: {
    backgroundColor: 'rgba(44, 62, 80, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: '#2C3E50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  photoId: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  ratioBadge: {
    backgroundColor: 'rgba(22, 160, 133, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#16A085',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  ratioText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  resolutionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(41, 128, 185, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#2980B9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  resolutionText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '92%',
    maxHeight: '92%',
    backgroundColor: '#ffffff',
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalScrollContent: {
    alignItems: 'center',
  },
  modalImageContainer: {
    width: '100%',
    height: 350,
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    padding: 20,
  },
  modalImageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  modalImageSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ECF0F1',
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  modalInfo: {
    width: '100%',
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  infoCardGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  infoEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  infoCardLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoCardValue: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '800',
    textAlign: 'center',
  },
  infoFullCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2C3E50',
  },
  infoFullRow: {
    width: '100%',
  },
  infoFullLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  infoFullValue: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  closeButtonWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    shadowColor: '#2C3E50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
