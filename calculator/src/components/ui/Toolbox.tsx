import { ColorSwatch, Group } from '@mantine/core';
import { SWATCHES } from '../../constant';
import { useState } from 'react';

interface ToolboxProps {
  setBrushSize: (size: number) => void;
  setOpacity: (opacity: number) => void;
  setColor: (color: string) => void;
}

export default function Toolbox({ setBrushSize, setOpacity, setColor }: ToolboxProps) {
  const [currentSize, setCurrentSize] = useState(3);
  const [currentOpacity, setCurrentOpacity] = useState(1);

  return (
    <div className='toolbox'>
      <div className="flex flex-col gap-2">
        <label>Brush Size:</label>
        <input 
          type='range' 
          min='1' 
          max='10' 
          value={currentSize} 
          onChange={(e) => {
            setCurrentSize(Number(e.target.value));
            setBrushSize(Number(e.target.value));
          }} 
        />
        <label>Opacity:</label>
        <input 
          type='range' 
          min='0.1' 
          max='1' 
          step='0.1' 
          value={currentOpacity} 
          onChange={(e) => {
            setCurrentOpacity(Number(e.target.value));
            setOpacity(Number(e.target.value));
          }} 
        />
        <label>Color:</label>
        <Group>
          {SWATCHES.map((swatch) => (
            <ColorSwatch 
              key={swatch} 
              color={swatch} 
              onClick={() => setColor(swatch)} 
            />
          ))}
        </Group>
      </div>
    </div>
  );
}
