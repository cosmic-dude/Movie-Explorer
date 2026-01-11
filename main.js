const searchBtn = document.getElementById("search-btn");
const movieTitleInput = document.getElementById("movie-title");
const resultsContainer = document.getElementById("results-container");
const sortBySelect = document.getElementById("sort-by");
const errorMessage = document.getElementById("error-message");
const homeBtn = document.getElementById("home-btn");
const featuredMoviesContainer = document.getElementById("featured-movies-container");
const featuredMoviesSection = document.getElementById("featured-movies-section");
const searchResultsSection = document.querySelector(".results-section:not(#featured-movies-section)");

const API_KEY = "610173a0"; // Replace with your OMDb API key
const defaultMovies = ["Inception", "The Dark Knight", "Interstellar", "Parasite"];

// Function to fetch and display movies
const searchMovies = () => {
    const movieTitle = movieTitleInput.value.trim();
    if (movieTitle === "") {
        alert("Please enter a movie title.");
        return;
    }

    errorMessage.style.display = "none";
    resultsContainer.innerHTML = ""; // Clear previous results
    featuredMoviesSection.style.display = "none"; // Hide featured movies
    searchResultsSection.style.display = "block"; // Show search results

    fetch(`https://www.omdbapi.com/?s=${movieTitle}&apikey=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
            if (data.Response === "True") {
                fetchFullMovieDetails(data.Search, displayMovies);
            } else {
                showError("Movie not found. Please try another title.");
            }
        })
        .catch(error => {
            console.error("Error fetching data:", error);
            showError("An error occurred while fetching data. Please check your network connection.");
        });
};

// Fetch full details for each movie
const fetchFullMovieDetails = (movies, displayFunction) => {
    const moviePromises = movies.map(movie =>
        fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${API_KEY}`)
            .then(response => response.json())
    );

    Promise.all(moviePromises)
        .then(movieData => {
            displayFunction(movieData);
        })
        .catch(error => {
            console.error("Error fetching detailed movie data:", error);
            showError("An error occurred while fetching movie details.");
        });
};

// Function to display movies in the grid
const displayMovies = (movies) => {
    resultsContainer.innerHTML = ""; // Clear previous results
    const sortedMovies = sortMovies(movies, sortBySelect.value);
    sortedMovies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        resultsContainer.appendChild(movieCard);
    });
};

const displayFeaturedMovies = (movies) => {
    featuredMoviesContainer.innerHTML = ""; // Clear previous results
    movies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        featuredMoviesContainer.appendChild(movieCard);
    });
}

// Function to create a movie card
const createMovieCard = (movie) => {
    const movieCard = document.createElement("div");
    movieCard.classList.add("movie-card");
    movieCard.dataset.year = movie.Year;
    movieCard.dataset.imdbRating = movie.imdbRating;

    const poster = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/280x420?text=No+Image";

    movieCard.innerHTML = `
        <img src="${poster}" alt="${movie.Title} Poster">
        <div class="movie-card-content">
             <h3 class="movie-card-title">${movie.Title} (${movie.Year})</h3>
            <p class="movie-card-details rating">⭐ ${movie.imdbRating}</p>
            <p class="movie-card-details">${movie.Genre}</p>
            <p class="movie-card-details plot">${movie.Plot}</p>
        </div>
    `;

    return movieCard;
};

// Function to show error messages
const showError = (message) => {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
};

// Function to sort movies
const sortMovies = (movies, sortBy) => {
    return movies.sort((a, b) => {
        const aValue = (sortBy === 'year') ? a.Year : a.imdbRating;
        const bValue = (sortBy === 'year') ? b.Year : b.imdbRating;

        // For IMDb rating and Year, higher is better, so sort descending
        return bValue.localeCompare(aValue, undefined, { numeric: true });
    });
};

const fetchDefaultMovies = () => {
    const moviePromises = defaultMovies.map(movieTitle =>
        fetch(`https://www.omdbapi.com/?t=${movieTitle}&apikey=${API_KEY}`)
            .then(response => response.json())
    );

    Promise.all(moviePromises)
        .then(movieData => {
            displayFeaturedMovies(movieData);
        })
        .catch(error => {
            console.error("Error fetching default movies:", error);
            showError("An error occurred while fetching default movies.");
        });
}

// Event Listeners
searchBtn.addEventListener("click", searchMovies);
movieTitleInput.addEventListener("keypress", (e) => {
    if (e.key === 'Enter') {
        searchMovies();
    }
});

sortBySelect.addEventListener("change", () => {
    const movieCards = Array.from(resultsContainer.querySelectorAll(".movie-card"));
    const movies = movieCards.map(card => ({
        imdbID: card.querySelector("img").alt.replace(" Poster", ""), // A bit of a hack to get the ID back
        Title: card.querySelector(".movie-card-title").textContent.split(' (')[0],
        Year: card.dataset.year,
        imdbRating: card.dataset.imdbRating,
        Genre: card.querySelector(".movie-card-details:nth-of-type(2)").textContent,
        Plot: card.querySelector(".plot").textContent,
        Poster: card.querySelector("img").src
    }));

    displayMovies(movies); // Re-display sorted movies
});

homeBtn.addEventListener("click", () => {
    location.reload();
});

document.addEventListener('DOMContentLoaded', () => {
    fetchDefaultMovies();
    searchResultsSection.style.display = "none";
});
