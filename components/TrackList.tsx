/**
 * TrackList Component with Drag-and-Drop
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * Performance optimized with FlatList virtualization
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
    FlatList,
    ListRenderItemInfo,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { Track } from '../models';

interface TrackListProps {
    tracks: Track[];
    side: 'A' | 'B';
    onReorder: (side: 'A' | 'B', fromIndex: number, toIndex: number) => void;
    onRemove: (trackId: string, side: 'A' | 'B') => void;
}

interface DraggableTrackItemProps {
    track: Track;
    index: number;
    side: 'A' | 'B';
    onRemove: (trackId: string, side: 'A' | 'B') => void;
    onDragStart: (index: number) => void;
    onDragEnd: (fromIndex: number, toIndex: number) => void;
    isDragging: boolean;
    draggedIndex: number | null;
}

const TRACK_HEIGHT = 80;

/**
 * Individual draggable track item - Memoized for performance
 */
const DraggableTrackItem = React.memo(function DraggableTrackItem({
    track,
    index,
    side,
    onRemove,
    onDragStart,
    onDragEnd,
    isDragging,
    draggedIndex,
}: DraggableTrackItemProps) {
    const translateY = useSharedValue(0);
    const startY = useSharedValue(0);
    const startIndex = useSharedValue(index);

    const panGesture = useMemo(() => Gesture.Pan()
        .onStart(() => {
            startY.value = translateY.value;
            startIndex.value = index;
            runOnJS(onDragStart)(index);
        })
        .onUpdate((event) => {
            translateY.value = startY.value + event.translationY;
        })
        .onEnd((event) => {
            const newIndex = Math.round(
                (startY.value + event.translationY) / TRACK_HEIGHT + startIndex.value
            );
            const clampedIndex = Math.max(0, newIndex);

            translateY.value = withSpring(0);
            runOnJS(onDragEnd)(startIndex.value, clampedIndex);
        }), [index, onDragStart, onDragEnd, startIndex, startY, translateY]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
            zIndex: isDragging && draggedIndex === index ? 1000 : 1,
            opacity: isDragging && draggedIndex === index ? 0.8 : 1,
        };
    }, [isDragging, draggedIndex, index, translateY]);

    const handleRemove = useCallback(() => {
        onRemove(track.id, side);
    }, [track.id, side, onRemove]);

    const metadataText = useMemo(() => {
        return track.source.type === 'url'
            ? `${track.source.metadata?.provider?.toUpperCase() || 'URL'}`
            : 'Local File';
    }, [track.source.type, track.source.metadata?.provider]);

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.trackItemContainer, animatedStyle]}>
                <View style={styles.trackItem}>
                    <View style={styles.dragHandle}>
                        <Text style={styles.dragHandleText}>⋮⋮</Text>
                    </View>
                    <View style={styles.trackInfo}>
                        <Text style={styles.trackTitle} numberOfLines={1}>
                            {track.title}
                        </Text>
                        {track.artist && (
                            <Text style={styles.trackArtist} numberOfLines={1}>
                                {track.artist}
                            </Text>
                        )}
                        <Text style={styles.trackMetadata} numberOfLines={1}>
                            {metadataText}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={handleRemove}
                    >
                        <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </GestureDetector>
    );
});

/**
 * TrackList component with drag-and-drop reordering
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * Optimized with FlatList for large track collections
 */
function TrackList({ tracks, side, onReorder, onRemove }: TrackListProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = useCallback((index: number) => {
        setDraggedIndex(index);
    }, []);

    const handleDragEnd = useCallback((fromIndex: number, toIndex: number) => {
        setDraggedIndex(null);

        // Only reorder if the position actually changed and is valid
        if (fromIndex !== toIndex && toIndex >= 0 && toIndex < tracks.length) {
            onReorder(side, fromIndex, toIndex);
        }
    }, [tracks.length, onReorder, side]);

    const renderItem = useCallback(({ item, index }: ListRenderItemInfo<Track>) => (
        <DraggableTrackItem
            track={item}
            index={index}
            side={side}
            onRemove={onRemove}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            isDragging={draggedIndex !== null}
            draggedIndex={draggedIndex}
        />
    ), [side, onRemove, handleDragStart, handleDragEnd, draggedIndex]);

    const keyExtractor = useCallback((item: Track) => item.id, []);

    const getItemLayout = useCallback((_data: ArrayLike<Track> | null | undefined, index: number) => ({
        length: TRACK_HEIGHT + 12, // Height + marginBottom
        offset: (TRACK_HEIGHT + 12) * index,
        index,
    }), []);

    const emptyComponent = useMemo(() => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tracks</Text>
            <Text style={styles.emptyStateSubtext}>
                Drag tracks here from the pool
            </Text>
        </View>
    ), []);

    if (tracks.length === 0) {
        return emptyComponent;
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <FlatList
                data={tracks}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                getItemLayout={getItemLayout}
                scrollEnabled={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                initialNumToRender={10}
                windowSize={5}
                style={styles.trackList}
            />
        </GestureHandlerRootView>
    );
}

export default React.memo(TrackList);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    trackList: {
        flex: 1,
    },
    trackItemContainer: {
        marginBottom: 12,
    },
    trackItem: {
        flexDirection: 'row',
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3a3a3a',
        padding: 12,
        alignItems: 'center',
        minHeight: TRACK_HEIGHT,
    },
    dragHandle: {
        width: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    dragHandleText: {
        color: '#666666',
        fontSize: 16,
        fontWeight: 'bold',
    },
    trackInfo: {
        flex: 1,
    },
    trackTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 2,
    },
    trackArtist: {
        fontSize: 12,
        color: '#aaaaaa',
        marginBottom: 2,
    },
    trackMetadata: {
        fontSize: 11,
        color: '#777777',
    },
    removeButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#3a3a3a',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    removeButtonText: {
        color: '#ff6b6b',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3a3a3a',
        borderStyle: 'dashed',
    },
    emptyStateText: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 4,
    },
    emptyStateSubtext: {
        fontSize: 12,
        color: '#555555',
    },
});
