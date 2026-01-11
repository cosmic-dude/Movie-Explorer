// --- API Key --- (Replace with your actual OMDb API Key)
const apiKey = '610173a0';

// --- DOM Elements ---
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const sortSelect = document.getElementById('sort');
const resultsContainer = document.getElementById('results-container');
const errorContainer = document.getElementById('error-container');
const recommendationsGrid = document.getElementById('recommendations-grid');
const movieCardTemplate = document.getElementById('movie-card-template');

// --- Web Component for Movie Card ---
class MovieCard extends HTMLElement {
    constructor() {
        super();
        const templateContent = movieCardTemplate.content;
        this.attachShadow({ mode: 'open' }).appendChild(templateContent.cloneNode(true));
    }

    set movie(movie) {
        this.shadowRoot.querySelector('.movie-title').textContent = movie.Title;
        this.shadowRoot.querySelector('.movie-year').textContent = `Year: ${movie.Year}`;
        this.shadowRoot.querySelector('.movie-genre').textContent = `Genre: ${movie.Genre}`;
        this.shadowRoot.querySelector('.movie-plot').textContent = movie.Plot;
        this.shadowRoot.querySelector('.movie-rating').textContent = `IMDb Rating: ${movie.imdbRating}`;
        this.shadowRoot.querySelector('.movie-poster').src = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/250x375.png?text=No+Poster';
        this.shadowRoot.querySelector('.movie-poster').alt = movie.Title;
    }
}
customElements.define('movie-card', MovieCard);

// --- Event Listeners ---
searchBtn.addEventListener('click', searchMovies);
sortSelect.addEventListener('change', sortMovies);

let currentMovies = [];

// --- Search Movies ---
async function searchMovies() {
    const searchTerm = searchInput.value.trim();
    if (searchTerm === '') {
        alert('Please enter a movie title.');
        return;
    }

    clearResults();

    try {
        const response = await fetch(`https://www.omdbapi.com/?s=${searchTerm}&apikey=${apiKey}`);
        const data = await response.json();

        if (data.Response === 'True') {
            const detailedMovies = await Promise.all(
                data.Search.map(movie => fetchMovieDetails(movie.imdbID))
            );
            currentMovies = detailedMovies.filter(movie => movie);
            displayMovies(currentMovies);
            if (currentMovies.length > 0) {
                getRecommendations(currentMovies[0].Genre);
            }
        } else {
            showError('Movie not found!');
        }
    } catch (error) {
        showError('An error occurred. Please try again later.');
        console.error('Error fetching data:', error);
    }
}

// --- Fetch Movie Details ---
async function fetchMovieDetails(imdbID) {
    try {
        const response = await fetch(`https://www.omdbapi.com/?i=${imdbID}&apikey=${apiKey}`);
        const data = await response.json();
        return data.Response === 'True' ? data : null;
    } catch (error) {
        console.error('Error fetching movie details:', error);
        return null;
    }
}

// --- Display Movies ---
function displayMovies(movies) {
    movies.forEach(movie => {
        const movieCard = document.createElement('movie-card');
        movieCard.movie = movie;
        resultsContainer.appendChild(movieCard);
    });
}

// --- Sort Movies ---
function sortMovies() {
    const sortBy = sortSelect.value;
    let sortedMovies = [...currentMovies];

    if (sortBy === 'year') {
        sortedMovies.sort((a, b) => b.Year - a.Year);
    } else if (sortBy === 'imdbRating') {
        sortedMovies.sort((a, b) => b.imdbRating - a.imdbRating);
    }

    clearResults();
    displayMovies(sortedMovies);
}

// --- Recommendations ---
async function getRecommendations(genre) {
    if (!genre) return;
    const primaryGenre = genre.split(',')[0].trim();
    recommendationsGrid.innerHTML = '';

    try {
        const response = await fetch(`https://www.omdbapi.com/?s=${primaryGenre}&apikey=${apiKey}`);
        const data = await response.json();

        if (data.Response === 'True') {
            const detailedMovies = await Promise.all(
                data.Search.slice(0, 5).map(movie => fetchMovieDetails(movie.imdbID))
            );
            detailedMovies.forEach(movie => {
                if(movie) {
                    const movieCard = document.createElement('movie-card');
                    movieCard.movie = movie;
                    recommendationsGrid.appendChild(movieCard);
                }
            });
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error);
    }
}

// --- Helper Functions ---
function clearResults() {
    resultsContainer.innerHTML = '';
    errorContainer.textContent = '';
}

function showError(message) {
    errorContainer.textContent = message;
}
