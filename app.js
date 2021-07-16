const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "moviesData.db");

let dataBase = null;

const initializeDBAndServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running Up");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertMovieObjectToResponsiveObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDirectorToResponsiveObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

app.get("/movies/", async (request, response) => {
  const getMovieNameQuery = `
    select * from movie;
    `;
  const movieName = await dataBase.all(getMovieNameQuery);
  response.send(
    movieName.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    select * from movie where movie_id = ${movieId};`;
  const movieDetails = await dataBase.get(getMovieQuery);
  response.send(convertMovieObjectToResponsiveObject(movieDetails));
});

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const createQuery = `
    INSERT INTO movie( director_id, movie_name, lead_actor) 
    VALUES (${directorId},
   '${movieName}',
   '${leadActor}');
    `;
  await dataBase.run(createQuery);
  response.send("Movie Successfully Added");
});

app.put("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const updatedMovie = request.body;
  const { directorId, movieName, leadActor } = updatedMovie;
  const updateQuery = `
    update movie 
    set director_id = ${directorId},
        movie_name = '${movieName}',
        lead_actor = '${leadActor}'
    where movie_id = ${movieId};`;
  await dataBase.run(updateQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const deleteQuery = `
    DELETE from movie where movie_id = ${movieId};
    `;
  await dataBase.run(deleteQuery);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
    SELECT
      *
    FROM
      director;`;
  const directorsArray = await dataBase.all(getDirectorsQuery);
  response.send(
    directorsArray.map((eachDirector) =>
      convertDirectorToResponsiveObject(eachDirector)
    )
  );
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMoviesQuery = `
    SELECT
      movie_name
    FROM
      movie
    WHERE
      director_id='${directorId}';`;
  const moviesArray = await dataBase.all(getDirectorMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

module.exports = app;
