<div align="center">
    <h1>Hootenanny UI</h1>
</div>

Hootenanny UI is a submodule of the [Hootennany](https://github.com/ngageoint/hootenanny) vector conflation project.

It provides the web interface for translation, conflation, editing, and export of vector datasets.

Hoot UI is built on [iD](https://github.com/openstreetmap/iD) - friendly JavaScript editor for [OpenStreetMap](http://www.openstreetmap.org/)




## Installation

Note: Windows users should run these steps in a shell started with "Run as administrator".
This is only necessary the first time so that the build process can create symbolic links.

To run the current development version of iD on your own computer:

#### Cloning the repository

```
git clone https://github.com/ngageoint/hootenanny-ui.git
```

Run `npm install` after cloning the repo to install all dependencies for the project

#### Running Hoot UI locally for development purposes

- Run `npm start`
- Open `http://localhost:8080/` in a web browser
- This relies on a vagrant machine running locally with port 8888 forwarding to tomcat

#### Building Hoot for production

-  Run `npm run production`

This will bundle the application and place static files inside `/dist`. This production build is what gets deployed via tomcat in the vagrant machine of the main [Hootenanny](https://github.com/ngageoint/hootenanny/) repo and by the RPMs available for CentOS7 [here](https://github.com/ngageoint/hootenanny-rpms/blob/master/docs/install.md).

#### Testing

- Run `npm test`

After Webpack finishes bundling, Chrome should automatically open and begin executing tests. Code coverage summary will output to CLI when tests are complete and full coverage details can be viewed by opening `/coverage/index.html` in the browser.

#### Code Formatting

Before beginning development, follow the instructions in this [medium post](https://medium.com/@netczuk/even-faster-code-formatting-using-eslint-22b80d061461) to make sure that your code editor enforces the project's eslint rules 'on save'!!!
