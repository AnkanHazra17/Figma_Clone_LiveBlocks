import React, { MutableRefObject, useCallback, useEffect, useState } from 'react'
import LiveCursors from './cursor/LiveCursors'
import { useBroadcastEvent, useEventListener, useMyPresence, useOthers } from '@/liveblocks.config'
import { CursorMode, CursorState, Reaction, ReactionEvent } from '@/types/type';
import CursorChat from './cursor/CursorChat';
import ReactionSelector from './reactions/ReactionButton';
import FlyingReaction from './reactions/FlyingReaction';
import useInterval from '@/hooks/useInterval';
import { Comments } from './comments/Comments';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { shortcuts } from '@/constants';

type Props = {
    canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
    undo: () => void;
    redo: () => void;
}

const Live = ({canvasRef, undo, redo}: Props) => {
    const others = useOthers();
    const [{cursor}, updateMyPresence] = useMyPresence() as any;
    const [cursorState, setCursorState] = useState<CursorState>({mode: CursorMode.Hidden,})
    const [reactions, setReactions] = useState<Reaction[]>([])
    const broadcast = useBroadcastEvent();

    const handlePointerMove = useCallback((event: React.PointerEvent) => {
        event.preventDefault();

        if(cursor === null || cursorState.mode !== CursorMode.ReactionSelector){
            const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
            const y = event.clientY - event.currentTarget.getBoundingClientRect().y;
    
            updateMyPresence({cursor: {x, y}});
        }

    }, [])

    const handlePointerLeav = useCallback((event: React.PointerEvent) => {
        setCursorState({mode: CursorMode.Hidden});

        updateMyPresence({cursor: null, message: null});
    }, [])

    const handlePointerUp = useCallback((event: React.PointerEvent) => {
        setCursorState((state: CursorState) => cursorState.mode === CursorMode.Reaction ? {...state, isPressed: true} : state)
    }, [cursorState.mode, setCursorState])

    const handlePointerDown = useCallback((event: React.PointerEvent) => {
        const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
        const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

        updateMyPresence({cursor: {x, y}});

        setCursorState((state: CursorState) => cursorState.mode === CursorMode.Reaction ? {...state, isPressed: true} : state)
    }, [cursorState.mode, setCursorState])

    const setRections = useCallback((reaction: string) => {
        setCursorState({mode: CursorMode.Reaction, reaction, isPressed: false})
    }, [])


    useInterval(() => {
        setReactions((reaction) => reaction.filter((react) => react.timestamp > Date.now() - 4000));
    }, 1000)

    // Broadcast the reaction to other users (every 100ms)
    useInterval(() => {
        if(cursorState.mode === CursorMode.Reaction && cursorState.isPressed && cursor){
            // concat all the reactions created on mouse click
            setReactions((reaction) => reaction.concat([
                {
                    point: {x: cursor.x, y: cursor.y},
                    value: cursorState.reaction,
                    timestamp: Date.now()
                }
            ]))

            broadcast({
                x: cursor.x,
                y: cursor.y,
                value: cursorState.reaction
            })
        }
    }, 100)

    useEventListener((eventData) => {
        const event = eventData.event as ReactionEvent;

        setReactions((reaction) => reaction.concat([
            {
                point: {x: event.x, y: event.y},
                value: event.value,
                timestamp: Date.now()
            }
        ]))

    })

    useEffect(() =>{
        const onKeyUp = (e: KeyboardEvent) => {
            if(e.key === "/"){
                setCursorState({
                    mode: CursorMode.Chat,
                    previousMessage: null,
                    message: "",
                })
            }else if (e.key === "Escape"){
                updateMyPresence({message: ''})
                setCursorState({mode: CursorMode.Hidden})
            }else if(e.key === "e"){
                setCursorState({mode: CursorMode.ReactionSelector})
            }
        } 

        const onKeyDown = (e: KeyboardEvent) => {
            if(e.key === "/"){
                e.preventDefault()
            }
        }

        window.addEventListener('keyup', onKeyUp);
        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.addEventListener('keyup', onKeyUp);
            window.addEventListener("keydown", onKeyDown);
        }

    }, [updateMyPresence])

    const handleContexMenuClick = useCallback((key: string) => {
        switch (key) {
            case "Chat":
                setCursorState({
                    mode: CursorMode.Chat,
                    previousMessage: null,
                    message: '',
                })
                break;

            case "Reactions":
                setCursorState({
                    mode: CursorMode.ReactionSelector
                });
                break;
                
            case "Undo":
                undo();
                break;

            case "Redo":
                redo();
                break;
            default:
                break;
        }
    }, [])

  return (
    <ContextMenu>
        <ContextMenuTrigger id='canvas' onPointerUp={handlePointerUp} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeav} onPointerDown={handlePointerDown} className='h-screen w-full flex items-center justify-center'>
            <canvas ref={canvasRef}></canvas>

            {
                reactions.map((r) => (
                    <FlyingReaction
                        key={r.timestamp.toString()}
                        x={r.point.x} 
                        y={r.point.y}
                        timestamp={r.timestamp}
                        value={r.value}
                    ></FlyingReaction>
                ))
            }

            {
                cursor && (
                    <CursorChat cursor={cursor} cursorState={cursorState} setCursorState={setCursorState} updateMyPresence={updateMyPresence}></CursorChat>
                )
            }

            {
                cursorState.mode === CursorMode.ReactionSelector && (
                    <ReactionSelector setReaction={setRections}></ReactionSelector>
                )
            }
            <LiveCursors others={others}></LiveCursors>
            <Comments></Comments>
        </ContextMenuTrigger>

        <ContextMenuContent className=' right-menu-content'>
            {
                shortcuts.map((item) => (
                    <ContextMenuItem key={item.key} className='flex items-center justify-between' onClick={() => handleContexMenuClick(item.name)}>
                        <p>{item.name}</p>
                        <p className='text-xs text-primary-grey-300'>{item.shortcut}</p>
                    </ContextMenuItem>
                ))
            }
        </ContextMenuContent>
    </ContextMenu>
  )
}

export default Live