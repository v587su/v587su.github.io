// Interactive behaviors for the static homepage:
// - Publication filters (DOM-based, all data is static in index.html)
// - Sticky publications header
// - Back-to-top button
// - Last modified date (from HTTP Last-Modified header)

let activeFilters = {
    cofirst: false,
    corresponding: false,
    year: 'all',
    venue: 'all'
};

function updateFilterButtonStyle(buttonId, isActive, activeColor) {
    const btn = document.getElementById(buttonId);
    if (isActive) {
        btn.style.backgroundColor = activeColor;
        btn.style.color = 'white';
        btn.style.borderColor = activeColor;
    } else {
        btn.style.backgroundColor = 'white';
        btn.style.color = '#666';
        btn.style.borderColor = '#ddd';
    }
}

function resetFilterButtonStyles() {
    updateFilterButtonStyle('filter-cofirst', false, '#4A90E2');
    updateFilterButtonStyle('filter-corresponding', false, '#E94B3C');
}

function applyPublicationFilters() {
    const pubs = document.querySelectorAll('#publications-list .publication');
    pubs.forEach(pub => {
        const myRole = parseInt(pub.dataset.myRole, 10);
        const year = pub.dataset.year;
        const venue = pub.dataset.venue;

        let visible = true;

        if (activeFilters.cofirst && !(myRole === 0 || myRole === 1)) visible = false;
        if (activeFilters.corresponding && myRole !== 2) visible = false;
        if (activeFilters.year !== 'all' && year !== activeFilters.year) visible = false;
        if (activeFilters.venue !== 'all' && venue !== activeFilters.venue) visible = false;

        pub.style.display = visible ? '' : 'none';
    });
}

function setupPublicationFilters() {
    document.getElementById('filter-cofirst').addEventListener('click', function() {
        if (activeFilters.cofirst) {
            activeFilters.cofirst = false;
        } else {
            activeFilters.cofirst = true;
            if (activeFilters.corresponding) {
                activeFilters.corresponding = false;
                updateFilterButtonStyle('filter-corresponding', false, '#E94B3C');
            }
        }
        updateFilterButtonStyle('filter-cofirst', activeFilters.cofirst, '#4A90E2');
        applyPublicationFilters();
    });

    document.getElementById('filter-corresponding').addEventListener('click', function() {
        if (activeFilters.corresponding) {
            activeFilters.corresponding = false;
        } else {
            activeFilters.corresponding = true;
            if (activeFilters.cofirst) {
                activeFilters.cofirst = false;
                updateFilterButtonStyle('filter-cofirst', false, '#4A90E2');
            }
        }
        updateFilterButtonStyle('filter-corresponding', activeFilters.corresponding, '#E94B3C');
        applyPublicationFilters();
    });

    const yearSelect = document.getElementById('filter-year');
    const venueSelect = document.getElementById('filter-venue');

    yearSelect.addEventListener('change', function() {
        activeFilters.year = this.value;
        applyPublicationFilters();
    });

    venueSelect.addEventListener('change', function() {
        activeFilters.venue = this.value;
        applyPublicationFilters();
    });

    document.getElementById('reset-filters').addEventListener('click', function() {
        activeFilters = {
            cofirst: false,
            corresponding: false,
            year: 'all',
            venue: 'all'
        };
        resetFilterButtonStyles();
        yearSelect.value = 'all';
        venueSelect.value = 'all';
        applyPublicationFilters();
    });
}

function setupPublicationsSticky() {
    const stickyHeader = document.getElementById('publications-sticky-header');
    if (!stickyHeader) return;

    const publicationsSection = document.getElementById('publications');
    if (!publicationsSection) return;

    let initialOffset = null;

    function calculateInitialOffset() {
        const rect = publicationsSection.getBoundingClientRect();
        initialOffset = rect.top + window.pageYOffset;
    }

    function handleScroll() {
        if (initialOffset === null) {
            calculateInitialOffset();
        }
        const scrollY = window.pageYOffset || window.scrollY;
        if (scrollY > initialOffset) {
            stickyHeader.classList.add('sticky-active');
        } else {
            stickyHeader.classList.remove('sticky-active');
        }
    }

    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    setTimeout(() => {
        calculateInitialOffset();
        handleScroll();
    }, 100);

    window.addEventListener('resize', function() {
        calculateInitialOffset();
        handleScroll();
    });
}

function setupBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');
    if (!backToTopButton) return;

    backToTopButton.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                const scrollY = window.pageYOffset || window.scrollY;
                if (scrollY > 300) {
                    backToTopButton.classList.add('show');
                } else {
                    backToTopButton.classList.remove('show');
                }
                ticking = false;
            });
            ticking = true;
        }
    });
}

async function setupLastModified() {
    try {
        const response = await fetch('./index.html', { method: 'HEAD' });
        if (!response.ok) return;
        const lastModifiedHeader = response.headers.get('Last-Modified');
        if (!lastModifiedHeader) return;
        const lastModified = new Date(lastModifiedHeader).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        document.getElementById('last-modified').textContent = `Last modified: ${lastModified}`;
    } catch (error) {
        console.error('Error fetching last modified time:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setupPublicationFilters();
    setupPublicationsSticky();
    setupBackToTop();
    setupLastModified();
});
