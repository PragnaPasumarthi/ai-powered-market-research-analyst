import traceback
import sys

try:
    import agents_graph
    print("agents_graph imported successfully")
except Exception as e:
    print("Error importing agents_graph:")
    traceback.print_exc()

try:
    import main
    print("main imported successfully")
except Exception as e:
    print("Error importing main:")
    traceback.print_exc()
