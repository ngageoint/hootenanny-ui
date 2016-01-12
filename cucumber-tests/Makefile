
SHELL=/bin/bash

# If the silent flag is passed to make then make hoot quiet too.
ifneq (,$(findstring s,$(MAKEFLAGS)))
  HOOT_OPTS=--warn
  TIME=
  ECHO=true
endif

HOOT_OPTS+= -D osm2ogr.ops=hoot::DecomposeBuildingRelationsVisitor
HOOT_OPTS+= -D services.db.writer.overwrite.map=true -D services.db.writer.create.user=true
HOOT_OPTS+= -D "services.db.writer.email=test@test.com" -D "services.db.reader.email=test@test.com"

DB_URL=postgresql://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)


test: tmp/TestRun.log

clean:
	rm -rf tmp

tmp/TestRun.log:
	hoot convert $(HOOT_OPTS) $(HOOT_HOME)/test-files/DcGisRoads.osm $(DB_URL)/DcGisRoadsCucumber
	hoot convert $(HOOT_OPTS) $(HOOT_HOME)/test-files/DcTigerRoads.osm $(DB_URL)/DcTigerRoadsCucumber
	hoot convert $(HOOT_OPTS) $(HOOT_HOME)/test-files/conflate/unified/AllDataTypesA.osm $(DB_URL)/AllDataTypesACucumber
	hoot convert $(HOOT_OPTS) $(HOOT_HOME)/test-files/conflate/unified/AllDataTypesB.osm $(DB_URL)/AllDataTypesBCucumber
	mkdir -p tmp


