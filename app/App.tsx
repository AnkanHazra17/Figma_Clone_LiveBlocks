"use client"


import Live from "@/components/Live";

import RightSideBar from "@/components/RightSideBar";
import { useEffect, useRef, useState } from "react";
import {fabric} from "fabric";
import { handleCanvasMouseDown, handleCanvasMouseUp, handleCanvasObjectModified, handleCanvasObjectScaling, handleCanvasSelectionCreated, handleCanvaseMouseMove, handlePathCreated, handleResize, initializeFabric, renderCanvas } from "@/lib/canvas";
import NavBar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import { ActiveElement, Attributes } from "@/types/type";
import { useMutation, useRedo, useStorage, useUndo } from "@/liveblocks.config";
import { defaultNavElement } from "@/constants";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { handleImageUpload } from "@/lib/shapes";


export default function Page() {

  const undo = useUndo();
  const redo = useRedo();


  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isDrawing = useRef(false);
  const shapeRef = useRef<fabric.Object | null>(null);
  const selectedShapeRef = useRef<string | null>(null);
  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: "",
    value: "",
    icon: "",
  })

  const [elementAttributes, setElementAttributes] = useState<Attributes>({
    width: '',
    height: '',
    fontSize: '',
    fontFamily: '',
    fontWeight: '',
    fill: '#aabbcc',
    stroke: '#aabbcc',
  })

  const activeObjectRef = useRef<fabric.Object | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isEditingRef = useRef(false);

  const canvasObjects = useStorage((root) => root.canvasObjects);
  
  const syncShapeInStorage = useMutation(({storage}, object) => {
    if(!object){
      return;
    }

    const {objectId} = object;
    const shapeData = object.toJSON();
    shapeData.objectId = objectId;

    const canvasObjects = storage.get("canvasObjects");
    canvasObjects.set(objectId, shapeData);
  }, [])

  const deleteAllShapes = useMutation(({storage}) => {
    const canvasObjects = storage.get("canvasObjects");

    if(!canvasObjects || canvasObjects.size === 0){
      return true;
    }

    for(const [key, value] of canvasObjects.entries()){
      canvasObjects.delete(key);
    }

    return canvasObjects.size === 0;

  }, [])

  const deleteShapesFromStorage = useMutation(({storage}, objectId) => {
    const canvasObjects = storage.get("canvasObjects");
    canvasObjects.delete(objectId)
  }, [])

  const handleActiveElement = (elem: ActiveElement) => {
    setActiveElement(elem);

    switch (elem?.value) {
      case 'reset':
        deleteAllShapes();
        fabricRef.current?.clear();
        setActiveElement(defaultNavElement)
        break;
      
      case 'delete':
        handleDelete(fabricRef.current as any, deleteShapesFromStorage);
        setActiveElement(defaultNavElement);
        break;

      case 'image':
        imageInputRef.current?.click();
        isDrawing.current = false;

        if(fabricRef.current){
          fabricRef.current.isDrawingMode = false;
        }
      default:
        break;
    }


    selectedShapeRef.current = elem?.value as string;
  }

  useEffect(() => {
    const canvas = initializeFabric({canvasRef, fabricRef});

    canvas.on("mouse:down", (options: any) => {
      handleCanvasMouseDown({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef
      })
    })

    canvas.on("mouse:move", (options: any) => {
      handleCanvaseMouseMove({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage,
      })
    })

    canvas.on("mouse:up", () => {
      handleCanvasMouseUp({
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage,
        setActiveElement,
        activeObjectRef
      })
    })

    canvas.on("object:modified", (options: any) => {
      handleCanvasObjectModified({
        options,
        syncShapeInStorage
      })
    })

    canvas.on("selection:created", (options: any) => {
      handleCanvasSelectionCreated({
        options,
        isEditingRef,
        setElementAttributes,
      })
    })

    canvas.on("object:scaling", (options: any) => {
      handleCanvasObjectScaling({
        options,
        setElementAttributes
      })
    })

    canvas.on("path:created", (options: any) => {
      handlePathCreated({
        options,
        syncShapeInStorage
      })
    })

    window.addEventListener("resize", () => {
      handleResize({ fabricRef })
    })

    window.addEventListener("keydown", (e: any) => {
      handleKeyDown({
        e,
        canvas: fabricRef.current,
        undo,
        redo,
        syncShapeInStorage,
        deleteShapesFromStorage
      })
    })

    return () => {
      canvas.dispose();
    }
  }, [])

  useEffect(() => {
    renderCanvas({
      fabricRef,
      canvasObjects,
      activeObjectRef,
    })
  }, [canvasObjects])


  return (
    <main className="w-full h-screen overflow-hidden">
      <NavBar activeElement={activeElement} handleActiveElement={handleActiveElement}
        imageInputRef={imageInputRef}
        handleImageUpload={(e: any) => {
          e.stopPropagation();
          handleImageUpload({
            file: e.target.files[0],
            canvas: fabricRef as any,
            shapeRef,
            syncShapeInStorage
          })
        }}
      ></NavBar>

      <section className="flex h-full">
        <LeftSidebar allShapes={Array.from(canvasObjects)}></LeftSidebar>
        <Live canvasRef={canvasRef} undo={undo} redo={redo}></Live>
        <RightSideBar 
          elementAttributes={elementAttributes}
          setElementAttributes={setElementAttributes}
          fabricRef={fabricRef}
          isEditingRef={isEditingRef}
          activeObjectRef={activeObjectRef}
          syncShapeInStorage={syncShapeInStorage}
        ></RightSideBar>
      </section>
    </main>
  );
}