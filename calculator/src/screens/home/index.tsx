import { useEffect, useRef, useState } from 'react';
import { Button, Group, ColorSwatch } from '@mantine/core';
import Draggable from 'react-draggable';
import { SWATCHES } from '../../constant';
import axios from 'axios';

interface GeneratedResult {
    expression: string;
    answer: string;
}

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255, 255, 255)');
    const [reset, setReset] = useState(false);
    const [dictOfVars, setDictOfVars] = useState({});
    const [result, setResult] = useState<GeneratedResult>();
    const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [toolboxVisible, setToolboxVisible] = useState(false); // For toggling toolbox visibility

    useEffect(() => {
        const canvas = canvasRef.current;
    
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight; // Fullscreen canvas
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
            }
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.MathJax.Hub.Config({
                tex2jax: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
            });
        };

        return () => {
            document.head.removeChild(script);
        };

    }, []);

    const renderLatexToCanvas = (expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setLatexExpression([...latexExpression, latex]);

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                setIsDrawing(true);
            }
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = color;
                ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                ctx.stroke();
            }
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const runRoute = async () => {
        const canvas = canvasRef.current;

        if (canvas) {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/calculate`, {
                image: canvas.toDataURL('image/png'),
                dict_of_vars: dictOfVars,
            });

            const resp = await response.data;
            resp.data.forEach((data: any) => {
                if (data.assign === true) {
                    setDictOfVars({
                        ...dictOfVars,
                        [data.expr]: data.result,
                    });
                }
            });

            const ctx = canvas.getContext('2d');
            const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
            let minX = canvas.width,
                minY = canvas.height,
                maxX = 0,
                maxY = 0;

            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const i = (y * canvas.width + x) * 4;
                    if (imageData.data[i + 3] > 0) {
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }

            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            setLatexPosition({ x: centerX, y: centerY });
            resp.data.forEach((data: any) => {
                setTimeout(() => {
                    setResult({
                        expression: data.expr,
                        answer: data.result,
                    });
                }, 1000);
            });
        }
    };

    return (
        <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
            <Button
                className='toolbox-button'
                onClick={() => setToolboxVisible(!toolboxVisible)}
                style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}
            >
                ⚙️ Open Toolbox
            </Button>

            {toolboxVisible && (
                <div
                    style={{
                        position: 'absolute',
                        top: '50px',
                        left: '10px',
                        zIndex: 10,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: '10px',
                        borderRadius: '8px',
                    }}
                >
                    <h4 style={{ color: 'white' }}>Brush Size:</h4>
                    <input type='range' min={1} max={10} step={1} onChange={(e) => console.log(e.target.value)} />
                    <h4 style={{ color: 'white' }}>Opacity:</h4>
                    <input type='range' min={0} max={1} step={0.1} onChange={(e) => console.log(e.target.value)} />
                    <h4 style={{ color: 'white' }}>Color:</h4>
                    <Group>
                        {SWATCHES.map((swatch) => (
                            <ColorSwatch key={swatch} color={swatch} onClick={() => setColor(swatch)} />
                        ))}
                    </Group>
                </div>
            )}

            <canvas
                ref={canvasRef}
                id='canvas'
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
            />

            {latexExpression &&
                latexExpression.map((latex, index) => (
                    <Draggable
                        key={index}
                        defaultPosition={latexPosition}
                        onStop={(e, data) => setLatexPosition({ x: data.x, y: data.y })}
                    >
                        <div className="absolute p-2 text-white rounded shadow-md">
                            <div className="latex-content">{latex}</div>
                        </div>
                    </Draggable>
                ))}

            <div className='controls' style={{ position: 'absolute', bottom: '20px', left: '10px', zIndex: 10 }}>
                <Button className='mr-2' variant='filled' onClick={() => setReset(true)}>
                    Download
                </Button>
                <Button variant='filled' onClick={runRoute}>
                    Process Drawing
                </Button>
            </div>
        </div>
    );
}
