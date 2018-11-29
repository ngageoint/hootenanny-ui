<div align="center">
    <h1>Hootenanny UI</h1>
</div>

Hootenanny UI is a submodule of the [Hootennany](https://github.com/ngageoint/hootenanny) vector conflation project.

It provides the web interface for translation, conflation, editing, and export of vector datasets.

Hoot UI is built on [iD](https://github.com/openstreetmap/iD) - friendly JavaScript editor for [OpenStreetMap](http://www.openstreetmap.org/)




## Installation

#### Cloning the repository

```
git clone https://github.com/ngageoint/hootenanny-ui.git
```

Run `npm install` after cloning the repo to install all dependencies for the project

#### Running Hoot locally

- Run `npm start`
- Open `http://localhost:8080/` in a web browser

#### Building Hoot for production

-  Run `npm run production`

This will bundle the application and place static files inside `/dist`. To test the production build, you must start an express server to proxy all requests to where hoot-services is running. You can start a preconfigured server by doing the following:

- `cd` into `/hoot-server`
- Run `npm install`
- Run `npm start`
- Open `http://localhost:8080/` in a web browser

#### Testing

- Run `npm run test:hoot`

After Webpack finishes bundling, Chrome should automatically open and begin executing tests. Code coverage summary will output to CLI when tests are complete and full coverage details can be viewed by opening `/coverage/index.html` in the browser.
