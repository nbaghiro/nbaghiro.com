import { Plate, frame, useNarrow } from './plate';

const ink = '#263e3b';
const hues = ['#d5e4de', '#e6dfce', '#dbe3ed'];
function Words({x,y,lines,size=15,fill=ink}) {
    return <text x={x} y={y} fill={fill} style={{fontSize:size, fontFamily:'inherit'}}>{lines.map((s,i)=><tspan key={s} x={x} dy={i?22:0}>{s}</tspan>)}</text>;
}
function Sheet({title,w,h,children}) {
    return <svg className="fig" viewBox={frame(w,h)} role="img" aria-label={title}>
        <title>{title}</title><Plate w={w} h={h} ground={[{y:h-28,amp:4}]}>{children}</Plate>
    </svg>;
}
function Rhythm() {
    const n=useNarrow(), w=n?336:820, h=n?550:330;
    const cards=[['01','Finish a useful step',['Give this stretch','a clear stopping point.']],['02','Leave a return note',['Capture the next decision','while it is still fresh.']],['03','Change the focus',['Take the learning along.','Come back with context.']]];
    return <Sheet title="A deliberate change of focus" w={w} h={h}>
        <Words x={14} y={32} lines={['A deliberate change of focus']} size={20}/>
        {cards.map(([num,title,lines],i)=>{const x=n?14:14+i*269,y=n?65+i*139:78,bw=n?308:253;return <g key={num}>
            <rect x={x} y={y} width={bw} height={118} rx={12} fill={hues[i]}/>
            <Words x={x+16} y={y+26} lines={[num]} size={12}/>
            <Words x={x+16} y={y+52} lines={[title]} size={18}/>
            <Words x={x+16} y={y+78} lines={lines}/>
            {i<2&&<path d={n?`M168 ${y+119}v18l-4 -5m4 5 4-5`:`M${x+bw} ${y+60}h15l-5 -4m5 4-5 4`} fill="none" stroke={ink}/>} 
        </g>})}
        <Words x={14} y={h-49} lines={['A proposed rhythm, with room to return.']} size={14}/>
    </Sheet>;
}
function Foundation() {
    const n=useNarrow(),w=n?336:820,h=n?720:450;
    return <Sheet title="Distinct products, a shared studio foundation" w={w} h={h}>
        <Words x={14} y={32} lines={n?['Distinct products.','A shared foundation.']:['Distinct products. A shared foundation.']} size={20}/>
        {[['App A','Its own audience'],['App B','Its own purpose'],['App C','Its own experience']].map(([name,note],i)=>{
            const x=n?35:62+i*255,y=n?98+i*139:80,pw=n?266:190;
            return <g key={name}>
                <rect x={x} y={y} width={pw} height={116} rx={17} fill={hues[i]} stroke="#9baea9"/>
                <rect x={x+pw/2-17} y={y+9} width={34} height={4} rx={2} fill="#9baea9"/>
                <Words x={x+19} y={y+48} lines={[name]} size={21}/>
                <Words x={x+19} y={y+78} lines={[note]} size={14}/>
                <path d={n?`M${x} ${y+58}H18`:`M${x+pw/2} ${y+116}V249`} stroke="#6c8d83" fill="none"/>
            </g>;
        })}
        <path d={n?'M18 156V541H48':'M157 249H667M410 249V277'} stroke="#6c8d83" fill="none"/>
        <rect x={n?35:65} y={n?522:277} width={n?266:690} height={n?113:94} rx={12} fill="#e1e7e1" stroke="#9baea9"/>
        <Words x={n?53:87} y={n?553:310} lines={['Shared studio practices']} size={19}/>
        <Words x={n?53:87} y={n?583:340} lines={n?['Testing · releases · support','Reuse where it helps.']:['Testing · releases · support     /     Reuse where it helps.']} size={14}/>
        <Words x={14} y={h-42} lines={['A proposed structure for the apps.']} size={14}/>
    </Sheet>;
}
function Attention() {
    const n=useNarrow(),w=n?336:820,h=n?535:395;
    const rows=[['Primary focus','One concrete next outcome',0.95],['Maintenance','Keep existing commitments',0.66],['Exploration','Make room for a new question',0.4]];
    return <Sheet title="Three kinds of work, with a changing balance" w={w} h={h}>
        <Words x={14} y={32} lines={n?['Three kinds of work.','A changing balance.']:['Three kinds of work. A changing balance.']} size={20}/>
        {rows.map(([label,note,f],i)=>{const y=n?104+i*117:87+i*82;return <g key={label}>
            <Words x={14} y={y} lines={[label]} size={19}/>
            <Words x={n?14:210} y={n?y+25:y} lines={[note]} size={14}/>
            <rect x={14} y={y+(n?40:16)} width={w-28} height={19} rx={9} fill="#e5e9e5"/>
            <rect x={14} y={y+(n?40:16)} width={(w-28)*f} height={19} rx={9} fill={hues[i]} stroke="#9baea9"/>
        </g>})}
        <Words x={14} y={h-58} lines={n?['Illustrative emphasis, not fixed hours.','User needs can change the balance.']:['Illustrative emphasis, not fixed hours. User needs can change the balance.']} size={14}/>
    </Sheet>;
}
export const PRODUCT_STUDIO_FIGURES={'studio-rhythm':Rhythm,'studio-foundation':Foundation,'studio-attention':Attention};
