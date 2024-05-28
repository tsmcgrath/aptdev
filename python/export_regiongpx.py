# Export selected regions to GPX files

mport os
import csv
import time
import asyncio
from qgis.utils import iface
from qgis.core import QgsProject, QgsVectorFileWriter, QgsCoordinateReferenceSystem
# select the layer to export
layername = 'APT24_v20-2'
project = QgsProject.instance()
canvas = iface.mapCanvas()
layer = QgsProject.instance().mapLayersByName(layername)[0]
gpxpath = "/tmp/gpx/sample.gpx"
iface.setActiveLayer(layer)
gpx_list = list("California", "Pacific Northwest")
for region in gpx_list:
    select_str = 'aptregion = ' + region
    layer.selectByExpression(select_str)
    time.sleep(10)
    # This exports the layout map to a .png
    exporter = QgsLayoutExporter(layout)
    settings = QgsLayoutExporter.ImageExportSettings()
    #The idea is that here you can change setting attributes e.g.
    settings.dpi = 300
    settings.imageDpi = 300
    settings.exportToImage = True