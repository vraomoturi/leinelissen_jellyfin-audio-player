import React, { useCallback, useEffect, useRef, ReactText } from 'react';
import { useGetImage } from 'utility/JellyfinApi';
import { MusicNavigationProp } from '../types';
import { Text, View, FlatList, ListRenderItem } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { differenceInDays } from 'date-fns';
import { useAppDispatch, useTypedSelector } from 'store';
import { fetchAllPlaylists } from 'store/music/actions';
import { PLAYLIST_CACHE_AMOUNT_OF_DAYS } from 'CONSTANTS';
import TouchableHandler from 'components/TouchableHandler';
import AlbumImage, { AlbumItem } from './components/AlbumImage';
import { EntityId } from '@reduxjs/toolkit';
import useDefaultStyles from 'components/Colors';

interface GeneratedAlbumItemProps {
    id: ReactText;
    imageUrl: string;
    name: string;
    onPress: (id: string) => void;
}

const GeneratedPlaylistItem = React.memo(function GeneratedPlaylistItem(props: GeneratedAlbumItemProps) {
    const defaultStyles = useDefaultStyles();
    const { id, imageUrl, name, onPress } = props;

    return (
        <TouchableHandler id={id as string} onPress={onPress}>
            <AlbumItem>
                <AlbumImage source={{ uri: imageUrl }} style={defaultStyles.imageBackground} />
                <Text numberOfLines={1} style={defaultStyles.text}>{name}</Text>
            </AlbumItem>
        </TouchableHandler>
    );
});

const Playlists: React.FC = () => {
    // Retrieve data from store
    const { entities, ids } = useTypedSelector((state) => state.music.playlists);
    const isLoading = useTypedSelector((state) => state.music.playlists.isLoading);
    const lastRefreshed = useTypedSelector((state) => state.music.playlists.lastRefreshed);
    
    // Initialise helpers
    const dispatch = useAppDispatch();
    const navigation = useNavigation<MusicNavigationProp>();
    const getImage = useGetImage();
    const listRef = useRef<FlatList<EntityId>>(null);

    const getItemLayout = useCallback((data: EntityId[] | null | undefined, index: number): { offset: number, length: number, index: number } => {
        const length = 220;
        const offset = length * index;
        return { index, length, offset };
    }, []);

    // Set callbacks
    const retrieveData = useCallback(() => dispatch(fetchAllPlaylists()), [dispatch]);
    const selectAlbum = useCallback((id: string) => {
        navigation.navigate('Playlist', { id });
    }, [navigation]);
    const generateItem: ListRenderItem<EntityId> = useCallback(({ item, index }) => {
        if (index % 2 === 1) {
            return <View key={item} />;
        }

        const nextItemId = ids[index + 1];
        const nextItem = entities[nextItemId];

        return (
            <View style={{ flexDirection: 'row', marginLeft: 10, marginRight: 10 }} key={item}>
                <GeneratedPlaylistItem
                    id={item}
                    imageUrl={getImage(item as string)}
                    name={entities[item]?.Name || ''}
                    onPress={selectAlbum}
                />
                {nextItem && 
                    <GeneratedPlaylistItem
                        id={nextItemId}
                        imageUrl={getImage(nextItemId as string)}
                        name={nextItem.Name || ''}
                        onPress={selectAlbum}
                    />
                }
            </View>
        );
    }, [entities, getImage, selectAlbum, ids]);

    // Retrieve data on mount
    useEffect(() => { 
        // GUARD: Only refresh this API call every set amounts of days
        if (!lastRefreshed || differenceInDays(lastRefreshed, new Date()) > PLAYLIST_CACHE_AMOUNT_OF_DAYS) {
            retrieveData(); 
        }
    });
    
    return (
        <FlatList
            data={ids} 
            refreshing={isLoading}
            onRefresh={retrieveData}
            getItemLayout={getItemLayout}
            ref={listRef}
            keyExtractor={(item, index) => `${item}_${index}`}
            renderItem={generateItem}
        />
    );
};


export default Playlists;