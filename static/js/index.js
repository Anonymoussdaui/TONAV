window.HELP_IMPROVE_VIDEOJS = false;

// More Works Dropdown Functionality
function toggleMoreWorks() {
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        button.classList.add('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const container = document.querySelector('.more-works-container');
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (container && !container.contains(event.target)) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Close dropdown on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('moreWorksDropdown');
        const button = document.querySelector('.more-works-btn');
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    const copyText = button.querySelector('.copy-text');
    
    if (bibtexElement) {
        navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
            // Success feedback
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bibtexElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        });
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Video carousel autoplay when in view
function setupVideoCarouselAutoplay() {
    const carouselVideos = document.querySelectorAll('.results-carousel video');
    
    if (carouselVideos.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Video is in view, play it
                video.play().catch(e => {
                    // Autoplay failed, probably due to browser policy
                    console.log('Autoplay prevented:', e);
                });
            } else {
                // Video is out of view, pause it
                video.pause();
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the video is visible
    });
    
    carouselVideos.forEach(video => {
        observer.observe(video);
    });
}

// Interactive experiment video browser
function setupExperimentBrowser() {
    const root = document.querySelector('.experiment-browser');
    if (!root) return;

    const basePath = 'static/videos/experiments';
    const taskLabels = {
        'close-drawer': 'Close Drawer',
        'lower-toilet-lid': 'Lower Toilet Lid',
        'turn-on-lamp': 'Turn On Lamp'
    };
    const modeButtons = Array.from(root.querySelectorAll('[data-experiment-mode]'));
    const taskButtons = Array.from(root.querySelectorAll('[data-experiment-task]'));
    const methodButtons = Array.from(root.querySelectorAll('[data-comparison-method]'));
    const panels = Array.from(root.querySelectorAll('[data-experiment-panel]'));
    const videos = Array.from(root.querySelectorAll('video'));
    const compareWith = root.querySelector('[data-experiment-video="comparison-with"]');
    const compareWithout = root.querySelector('[data-experiment-video="comparison-without"]');
    const endToEnd = root.querySelector('[data-experiment-video="endtoend"]');
    const teleTonav = root.querySelector('[data-experiment-video="teledata-tonav"]');
    const teleIntern = root.querySelector('[data-experiment-video="teledata-internvln"]');
    const teleStream = root.querySelector('[data-experiment-video="teledata-streamvln"]');
    const syncButton = root.querySelector('[data-sync-play]');
    const syncProgress = root.querySelector('[data-sync-progress]');
    const syncTime = root.querySelector('[data-sync-time]');
    let activeMode = 'comparison';
    let activeTask = 'close-drawer';
    let activeMethod = 'tonav';

    function setPressed(buttons, activeButton) {
        buttons.forEach((button) => {
            const active = button === activeButton;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }

    function setVideoSource(video, path) {
        if (!video || video.dataset.src === path) return;
        video.pause();
        video.dataset.src = path;
        video.src = path;
        video.poster = path.replace(/\.mp4$/, '.jpg');
        video.load();
    }

    function pauseAll() {
        videos.forEach((video) => video.pause());
        updateSyncButton(false);
    }

    function renderActivePanel() {
        const taskLabel = taskLabels[activeTask];
        if (activeMode === 'comparison') {
            setVideoSource(compareWith, `${basePath}/comparison/${activeTask}/${activeMethod}-with-pv.mp4`);
            setVideoSource(compareWithout, `${basePath}/comparison/${activeTask}/${activeMethod}-without-pv.mp4`);
            root.querySelectorAll('[data-comparison-caption]').forEach((caption) => {
                caption.textContent = `${activeMethod.toUpperCase()} · ${taskLabel}`;
            });
            syncProgress.value = 0;
            syncTime.value = '00:00 / 00:00';
        } else if (activeMode === 'endtoend') {
            setVideoSource(endToEnd, `${basePath}/endtoend/${activeTask}.mp4`);
            root.querySelector('[data-endtoend-caption]').textContent = `TONAV · ${taskLabel}`;
        } else {
            setVideoSource(teleTonav, `${basePath}/teledata/${activeTask}/tonav.mp4`);
            setVideoSource(teleIntern, `${basePath}/teledata/${activeTask}/internvln.mp4`);
            setVideoSource(teleStream, `${basePath}/teledata/${activeTask}/streamvln.mp4`);
            root.querySelectorAll('[data-teledata-caption]').forEach((caption) => {
                caption.textContent = taskLabel;
            });
        }
    }

    function showMode(mode) {
        activeMode = mode;
        pauseAll();
        panels.forEach((panel) => {
            panel.hidden = panel.dataset.experimentPanel !== mode;
        });
        renderActivePanel();
    }

    function formatTime(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
        const minutes = Math.floor(seconds / 60);
        const remaining = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
    }

    function comparisonDuration() {
        const durations = [compareWith.duration, compareWithout.duration].filter(Number.isFinite);
        return durations.length ? Math.min(...durations) : 0;
    }

    function updateSyncButton(playing) {
        const symbol = syncButton.querySelector('[data-sync-symbol]');
        const text = syncButton.querySelector('[data-sync-label]');
        symbol.textContent = playing ? 'Ⅱ' : '▶';
        text.textContent = playing ? 'Pause both' : 'Play both';
    }

    function updateSyncProgress() {
        const duration = comparisonDuration();
        const current = Math.min(compareWith.currentTime || 0, duration || Infinity);
        syncProgress.value = duration ? Math.round((current / duration) * 1000) : 0;
        syncTime.value = `${formatTime(current)} / ${formatTime(duration)}`;
        if (!compareWith.paused && !compareWithout.paused && Math.abs(compareWith.currentTime - compareWithout.currentTime) > 0.15) {
            compareWithout.currentTime = compareWith.currentTime;
        }
        updateSyncButton(!compareWith.paused && !compareWithout.paused);
    }

    modeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            setPressed(modeButtons, button);
            showMode(button.dataset.experimentMode);
        });
    });

    taskButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeTask = button.dataset.experimentTask;
            setPressed(taskButtons, button);
            pauseAll();
            renderActivePanel();
        });
    });

    methodButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeMethod = button.dataset.comparisonMethod;
            setPressed(methodButtons, button);
            pauseAll();
            renderActivePanel();
        });
    });

    syncButton.addEventListener('click', async () => {
        if (!compareWith.paused || !compareWithout.paused) {
            compareWith.pause();
            compareWithout.pause();
            updateSyncButton(false);
            return;
        }
        const duration = comparisonDuration();
        if (duration && compareWith.currentTime >= duration - 0.1) {
            compareWith.currentTime = 0;
            compareWithout.currentTime = 0;
        } else {
            compareWithout.currentTime = compareWith.currentTime;
        }
        await Promise.allSettled([compareWith.play(), compareWithout.play()]);
        updateSyncButton(!compareWith.paused && !compareWithout.paused);
    });

    syncProgress.addEventListener('input', () => {
        const duration = comparisonDuration();
        if (!duration) return;
        const target = (Number(syncProgress.value) / 1000) * duration;
        compareWith.currentTime = target;
        compareWithout.currentTime = target;
        updateSyncProgress();
    });

    compareWith.addEventListener('timeupdate', updateSyncProgress);
    compareWith.addEventListener('loadedmetadata', updateSyncProgress);
    compareWithout.addEventListener('loadedmetadata', updateSyncProgress);
    compareWith.addEventListener('ended', () => updateSyncButton(false));
    compareWithout.addEventListener('ended', () => updateSyncButton(false));

    renderActivePanel();
}

document.addEventListener('DOMContentLoaded', setupExperimentBrowser);

$(document).ready(function() {
    // Check for click events on the navbar burger icon

    var options = {
		slidesToScroll: 1,
		slidesToShow: 1,
		loop: true,
		infinite: true,
		autoplay: true,
		autoplaySpeed: 5000,
    }

	// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);
	
    bulmaSlider.attach();
    
    // Setup video autoplay for carousel
    setupVideoCarouselAutoplay();

})
