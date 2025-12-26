/**
 * Playlist Player
 * Handles continuous playback and navigation for playlist videos
 */

class PlaylistPlayer {
    constructor(options = {}) {
        this.playlistId = options.playlistId || null;
        this.items = options.items || [];
        this.currentIndex = options.startIndex || 0;
        this.autoPlay = options.autoPlay !== false;
        this.onVideoEnd = options.onVideoEnd || null;
        this.onItemChange = options.onItemChange || null;

        this.videoElement = null;
        this.currentTime = 0;
        this.endTime = null;
    }

    /**
     * Initialize the playlist player
     */
    init(videoElement) {
        this.videoElement = videoElement;

        // Set up time update listener for end time checking
        if (this.videoElement) {
            this.videoElement.addEventListener('timeupdate', () => this.checkEndTime());
        }
    }

    /**
     * Get current item
     */
    currentItem() {
        return this.items[this.currentIndex];
    }

    /**
     * Check if we've reached the end time for partial playback
     */
    checkEndTime() {
        if (!this.videoElement || this.endTime === null) return;

        if (this.videoElement.currentTime >= this.endTime) {
            this.videoElement.pause();
            this.next();
        }
    }

    /**
     * Get the start time for the current item
     */
    getStartTime() {
        const item = this.currentItem();
        return item && item.startTime ? parseFloat(item.startTime) : 0;
    }

    /**
     * Get the end time for the current item
     */
    getEndTime() {
        const item = this.currentItem();
        return item && item.endTime ? parseFloat(item.endTime) : null;
    }

    /**
     * Move to next video
     */
    next() {
        if (this.currentIndex < this.items.length - 1) {
            this.goToIndex(this.currentIndex + 1);
        } else {
            // End of playlist
            if (this.onVideoEnd) {
                this.onVideoEnd();
            }
        }
    }

    /**
     * Move to previous video
     */
    previous() {
        if (this.currentIndex > 0) {
            this.goToIndex(this.currentIndex - 1);
        }
    }

    /**
     * Jump to specific index
     */
    goToIndex(index) {
        if (index < 0 || index >= this.items.length) return;

        this.currentIndex = index;
        const item = this.currentItem();

        // Update end time
        this.endTime = this.getEndTime();

        // Notify listener
        if (this.onItemChange) {
            this.onItemChange(item, index);
        }
    }

    /**
     * Jump to specific item by ID
     */
    goToItem(itemId) {
        const index = this.items.findIndex(item => item.id == itemId);
        if (index !== -1) {
            this.goToIndex(index);
        }
    }

    /**
     * Get progress percentage through playlist
     */
    getProgress() {
        return ((this.currentIndex + 1) / this.items.length) * 100;
    }

    /**
     * Seek to start time of current item
     */
    seekToStart() {
        if (this.videoElement) {
            this.videoElement.currentTime = this.getStartTime();
        }
    }

    /**
     * Reset to beginning
     */
    reset() {
        this.currentIndex = 0;
        this.endTime = this.getEndTime();
    }
}

/**
 * Initialize playlist from DOM data attributes
 */
function initPlaylistFromDOM() {
    const playlistContainer = document.querySelector('[data-playlist-id]');
    if (!playlistContainer) return null;

    const playlistId = parseInt(playlistContainer.dataset.playlistId);
    const items = [];

    // Collect items from DOM
    document.querySelectorAll('[data-item-id]').forEach(el => {
        const itemId = el.dataset.itemId;
        const videoId = el.dataset.videoId;
        const projectId = el.dataset.projectId;
        const startTime = parseFloat(el.dataset.startTime) || 0;
        const endTime = el.dataset.endTime ? parseFloat(el.dataset.endTime) : null;

        items.push({
            id: itemId,
            videoId: videoId,
            projectId: projectId,
            startTime: startTime,
            endTime: endTime
        });
    });

    // Find current video index
    const currentVideoId = playlistContainer.dataset.currentVideoId;
    let startIndex = 0;
    if (currentVideoId) {
        const index = items.findIndex(item => item.videoId == currentVideoId);
        if (index !== -1) startIndex = index;
    }

    return new PlaylistPlayer({
        playlistId: playlistId,
        items: items,
        startIndex: startIndex,
        autoPlay: true,
        onItemChange: (item, index) => {
            // Navigate to the video
            const url = `/projects/${item.projectId}?video=${item.videoId}`;
            if (item.startTime > 0) {
                window.location.href = url + '&t=' + item.startTime;
            } else {
                window.location.href = url;
            }
        }
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlaylistPlayer, initPlaylistFromDOM };
}
