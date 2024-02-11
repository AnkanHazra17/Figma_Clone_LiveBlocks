import CursorSVG from '@/public/assets/CursorSVG';
import React from 'react'

type Props = {
    color: string;
    x: number;
    y: number;
    message: string;
}

const Corsor = ({color, x, y, message}: Props) => {
  return (
    <div className='pointer-events-none absolute top-0 left-0' style={{transform: `translateX(${x}px) translateY(${y}px)`}}>
        <CursorSVG color={color}></CursorSVG>
        {
            message && (
                <div className=' absolute top-2 left-5 rounded-2xl px-4 py-2' style={{backgroundColor: color}}>
                    <p className='text-white whitespace-nowrap text-sm leading-relaxed'>{message}</p>
                </div>
            )
        }
    </div>
  )
}

export default Corsor