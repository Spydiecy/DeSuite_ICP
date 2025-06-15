import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";

actor PhotoGallery {
    type PhotoId = Nat;
    type AlbumId = Nat;
    type UserId = Principal;

    type Photo = {
        id: PhotoId;
        name: Text;
        contentType: Text;
        data: Blob;
        owner: UserId;
        createdAt: Int;
        size: Nat;
        albumId: ?AlbumId;
    };

    type Album = {
        id: AlbumId;
        name: Text;
        owner: UserId;
        createdAt: Int;
    };

    private func natHash(n: Nat) : Nat32 {
        return Nat32.fromNat(n);
    };

    private stable var nextPhotoId: PhotoId = 0;
    private stable var nextAlbumId: AlbumId = 0;
    private stable var photosEntries : [(PhotoId, Photo)] = [];
    private stable var albumsEntries : [(AlbumId, Album)] = [];
    private var photos = HashMap.HashMap<PhotoId, Photo>(1, Nat.equal, natHash);
    private var albums = HashMap.HashMap<AlbumId, Album>(1, Nat.equal, natHash);
    private var userPhotos = HashMap.HashMap<UserId, [PhotoId]>(1, Principal.equal, Principal.hash);
    private var userAlbums = HashMap.HashMap<UserId, [AlbumId]>(1, Principal.equal, Principal.hash);
    private var userStorageUsage = HashMap.HashMap<UserId, Nat>(1, Principal.equal, Principal.hash);

    let MAX_STORAGE_PER_USER : Nat = 100 * 1024 * 1024; // 100 MB in bytes

    public shared(msg) func uploadPhoto(name: Text, contentType: Text, data: Blob, albumId: ?AlbumId) : async Result.Result<PhotoId, Text> {
        let caller = msg.caller;
        let photoSize = data.size();
        let currentUsage = Option.get(userStorageUsage.get(caller), 0);

        if (currentUsage + photoSize > MAX_STORAGE_PER_USER) {
            return #err("Storage limit exceeded");
        };

        let photoId = nextPhotoId;
        nextPhotoId += 1;

        let newPhoto : Photo = {
            id = photoId;
            name = name;
            contentType = contentType;
            data = data;
            owner = caller;
            createdAt = Time.now();
            size = photoSize;
            albumId = albumId;
        };

        photos.put(photoId, newPhoto);
        
        switch (userPhotos.get(caller)) {
            case (null) { userPhotos.put(caller, [photoId]); };
            case (?existingPhotos) {
                userPhotos.put(caller, Array.append(existingPhotos, [photoId]));
            };
        };

        userStorageUsage.put(caller, currentUsage + photoSize);

        #ok(photoId)
    };

    public shared(msg) func deletePhoto(photoId: PhotoId) : async Result.Result<(), Text> {
        switch (photos.get(photoId)) {
            case (?photo) {
                if (photo.owner == msg.caller) {
                    photos.delete(photoId);
                    switch (userPhotos.get(msg.caller)) {
                        case (?userPhotoIds) {
                            let updatedUserPhotos = Array.filter(userPhotoIds, func (id: PhotoId) : Bool { id != photoId });
                            userPhotos.put(msg.caller, updatedUserPhotos);
                        };
                        case (null) {};
                    };
                    let currentUsage = Option.get(userStorageUsage.get(msg.caller), 0);
                    userStorageUsage.put(msg.caller, currentUsage - photo.size);
                    #ok()
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("Photo not found") };
        }
    };

    public query(msg) func getPhoto(photoId: PhotoId) : async Result.Result<Photo, Text> {
        switch (photos.get(photoId)) {
            case (?photo) {
                if (photo.owner == msg.caller) {
                    #ok(photo)
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("Photo not found") };
        }
    };

    public query(msg) func getUserPhotos() : async [Photo] {
        switch (userPhotos.get(msg.caller)) {
            case (?photoIds) {
                Array.mapFilter(photoIds, func (id: PhotoId) : ?Photo { photos.get(id) })
            };
            case (null) { [] };
        }
    };

    public query(msg) func getUserStorageUsage() : async Nat {
        Option.get(userStorageUsage.get(msg.caller), 0)
    };

    public shared(msg) func createAlbum(name: Text) : async Result.Result<AlbumId, Text> {
        let caller = msg.caller;
        let albumId = nextAlbumId;
        nextAlbumId += 1;

        let newAlbum : Album = {
            id = albumId;
            name = name;
            owner = caller;
            createdAt = Time.now();
        };

        albums.put(albumId, newAlbum);

        switch (userAlbums.get(caller)) {
            case (null) { userAlbums.put(caller, [albumId]); };
            case (?existingAlbums) {
                userAlbums.put(caller, Array.append(existingAlbums, [albumId]));
            };
        };

        #ok(albumId)
    };

    public shared(msg) func deleteAlbum(albumId: AlbumId) : async Result.Result<(), Text> {
        switch (albums.get(albumId)) {
            case (?album) {
                if (album.owner == msg.caller) {
                    albums.delete(albumId);
                    switch (userAlbums.get(msg.caller)) {
                        case (?userAlbumIds) {
                            let updatedUserAlbums = Array.filter(userAlbumIds, func (id: AlbumId) : Bool { id != albumId });
                            userAlbums.put(msg.caller, updatedUserAlbums);
                        };
                        case (null) {};
                    };
                    // Move photos from this album to the main gallery
                    for ((photoId, photo) in photos.entries()) {
                        if (photo.albumId == ?albumId) {
                            let updatedPhoto = {
                                id = photo.id;
                                name = photo.name;
                                contentType = photo.contentType;
                                data = photo.data;
                                owner = photo.owner;
                                createdAt = photo.createdAt;
                                size = photo.size;
                                albumId = null;
                            };
                            photos.put(photoId, updatedPhoto);
                        };
                    };
                    #ok()
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("Album not found") };
        }
    };

    public query(msg) func getUserAlbums() : async [Album] {
        switch (userAlbums.get(msg.caller)) {
            case (?albumIds) {
                Array.mapFilter(albumIds, func (id: AlbumId) : ?Album { albums.get(id) })
            };
            case (null) { [] };
        }
    };

    public query(msg) func getPhotosInAlbum(albumId: AlbumId) : async [Photo] {
        switch (albums.get(albumId)) {
            case (?album) {
                if (album.owner == msg.caller) {
                    Array.filter(Iter.toArray(photos.vals()), func (photo: Photo) : Bool { 
                        photo.albumId == ?albumId and photo.owner == msg.caller 
                    })
                } else {
                    []
                }
            };
            case (null) { [] };
        }
    };

    system func preupgrade() {
        photosEntries := Iter.toArray(photos.entries());
        albumsEntries := Iter.toArray(albums.entries());
    };

    system func postupgrade() {
        photos := HashMap.fromIter<PhotoId, Photo>(photosEntries.vals(), 1, Nat.equal, natHash);
        albums := HashMap.fromIter<AlbumId, Album>(albumsEntries.vals(), 1, Nat.equal, natHash);
        photosEntries := [];
        albumsEntries := [];

        for ((photoId, photo) in photos.entries()) {
            switch (userPhotos.get(photo.owner)) {
                case (null) { userPhotos.put(photo.owner, [photoId]); };
                case (?existingPhotos) {
                    let alreadyExists = Option.isSome(Array.find(existingPhotos, func (id: PhotoId) : Bool { id == photoId }));
                    if (not alreadyExists) {
                        userPhotos.put(photo.owner, Array.append(existingPhotos, [photoId]));
                    };
                };
            };
            let currentUsage = Option.get(userStorageUsage.get(photo.owner), 0);
            userStorageUsage.put(photo.owner, currentUsage + photo.size);
        };

        for ((albumId, album) in albums.entries()) {
            switch (userAlbums.get(album.owner)) {
                case (null) { userAlbums.put(album.owner, [albumId]); };
                case (?existingAlbums) {
                    let alreadyExists = Option.isSome(Array.find(existingAlbums, func (id: AlbumId) : Bool { id == albumId }));
                    if (not alreadyExists) {
                        userAlbums.put(album.owner, Array.append(existingAlbums, [albumId]));
                    };
                };
            };
        };
    };
}