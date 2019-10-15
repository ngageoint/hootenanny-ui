## Creating Schema Field Values
Each schema that the Translation Assistant uses requires a list of possible values for the user to select from.


### JSON File Structure
The `XXX_field_values.json` file has this structure:
```
{
  "mgcpFieldValues":[
  {
    "key":"AFA::Available Vessel Service",
    "value":[
      "Helipad",
      "None Available",
      "Other",
      "Unknown"
    ]
  },
  {
    "key":"AOO::Angle of Orientation",
    "value":[
      "Value"
    ]
  }
  ]
}
```


### Generating the JSON files
The scripts that generate the translation schema files can also generate the field values. The schema files and scripts are in the main hoot repo https://github.com/ngageoint/hootenanny.  The commands are as follows:

MGCP:
```
$HOOT_HOME/scripts/schema/ConvertMGCPSchema_XML.py --fieldvalues \
  $HOOT_HOME/conf/translations/MGCP_FeatureCatalogue_TRD4_v4.5_20190208.xml.gz > $HOOT_HOME/hoot-ui-2x/data/mgcp_field_values.json
```

TDSv40:
```
$HOOT_HOME/scripts/schema/ConvertTDSv40Schema.py  --fieldvalues \
  $HOOT_HOME/conf/translations/TDSv40.csv.gz > $HOOT_HOME/hoot-ui-2x/data/tdsv40_field_values.json
```

TDSv61:
```
$HOOT_HOME/scripts/schema/ConvertTDSv61Schema.py  --fieldvalues \
  $HOOT_HOME/conf/translations/TDSv60.csv.gz \
  $HOOT_HOME/conf/translations/TDS_NGAv01.csv.gz > $HOOT_HOME/hoot-ui-2x/data/tdsv61_field_values.json
```

TDSv70:
```
$HOOT_HOME/scripts/schema/ConvertTDSv70Schema.py --fieldvalues \
  $HOOT_HOME/conf/translations/TDSv70_Features.csv.gz \
  $HOOT_HOME/conf/translations/TDSv70_Values.csv.gz > $HOOT_HOME/hoot-ui-2x/data/tdsv70_field_values.json
```

GGDMv30:
```
$HOOT_HOME/scripts/schema/ConvertGGDMv30Schema.py  --fieldvalues \
  $HOOT_HOME/conf/translations/GGDM30_Features.csv.gz \
  $HOOT_HOME/conf/translations/GGDM30_Layers.csv.gz \
  $HOOT_HOME/conf/translations/GGDM30_Values.csv.gz > $HOOT_HOME/hoot-ui-2x/data/ggdm_field_values.json
```

### Adding new schema values to the Translation Assistant UI
* Generate the `XXX_field_values.json` file for the schema

* Edit the `data/index.js` file:
  - Add the schema to the list of `import` lines at the top of the file
  - Add the schema to the `taginfo` structure at the bottom of the file

* Edit the `modules/Hoot/ui/managePanel/transAssist/upload.js` file:
  - Add the schema to the `schemaOptions` object at the top of the file
  - Check if you need schema validation. If you do, edit and/or add it at the bollom of the file

* Think about how to test the translation and either add to the existing ones in (back in the main hoot repo)
  `$HOOT_HOME/test-files/translation_assistant`
  or create a new test.


