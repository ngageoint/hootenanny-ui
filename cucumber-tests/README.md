## Cucumber UI Tests

Before running the tests, some Hoot map data needs to be created by running:
```
cd hoot
source SetupEnv.sh
source conf/DatabaseConfig.sh
cd hoot-ui/cucumber-tests
make test
```
To run cucumber tests 'headless' on vagrant vm:
```
xvfb-run --server-args="-screen 0, 1024x768x24" cucumber
```
To run locally, just run:
```
cucumber
```

