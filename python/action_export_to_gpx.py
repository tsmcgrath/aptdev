from qgis.utils import iface
from qgis.core import QgsProject, QgsVectorFileWriter, QgsCoordinateReferenceSystem

path = "/tmp/gpx/sample.gpx"
layer = QgsProject.instance().mapLayer("[% @layer_id %]")

if layer.selectedFeatureCount():
    options = QgsVectorFileWriter.SaveVectorOptions()
    options.ct = QgsCoordinateTransform(layer.crs(), QgsCoordinateReferenceSystem(4326), QgsProject.instance())
    options.driverName = "GPX"
    options.datasourceOptions = ["GPX_USE_EXTENSIONS=ON"]
    options.fileEncoding = "utf-8"
    options.layerOptions=["FORCE_GPX_ROUTE=YES"]
    options.onlySelectedFeatures = True

    result, error_string = QgsVectorFileWriter.writeAsVectorFormatV2(
        layer,
        path,
        layer.transformContext(),
        options)
    if result == QgsVectorFileWriter.NoError:
        iface.messageBar().pushSuccess(
            "Export2GPX", 
            "Exported {count} lines to <a href='file://{path}'>{path}</a>".format(
                count=layer.selectedFeatureCount(), 
                path=path))
    else: 
        iface.messageBar().pushWarning("Export2GPX", "Ouch! Errors exporting: {}".format(error_string))
else:
    iface.messageBar().pushInfo("Export2GPX", "First select some features...")