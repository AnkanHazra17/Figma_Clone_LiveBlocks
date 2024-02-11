import { LiveCursorProps } from '@/types/type'
import React from 'react'
import Corsor from './Corsor';
import { COLORS } from '@/constants';

const LiveCursors = ({others}: LiveCursorProps) => {
  return (
    others.map(({connectionId, presence}) => {
        if(!presence?.cursor){
            return null;
        }

        return (
            <Corsor key={connectionId} 
            color={COLORS[Number(connectionId) % COLORS.length]} 
            x={presence.cursor.x} y={presence.cursor.y} message={presence.message}></Corsor>
        )
    })
  )
}

export default LiveCursors