cd jsdoc-toolkit
java -jar jsrun.jar app/run.js -a -t=templates/bootstrap -d=../apidocs ../Core.js ../*.js ../scenegraph/*.js ../audio/*.js
cd ..
rm -r apidocs/symbols/src