"""Generate the eleven industry cover plates, then use render.mjs and webp.py as usual."""
from pathlib import Path
import json,html
HERE=Path(__file__).parent
items=json.loads((HERE/'industry.json').read_text())
def tag(name,attrs,body=''):
 return '<'+name+' '+ ' '.join(f'{k}="{html.escape(str(v))}"' for k,v in attrs.items())+'>'+body+'</'+name+'>'
def text(x,y,s,size=22,cls='label',anchor='start'):
 return tag('text',dict(x=x,y=y,**{'font-size':size,'class':cls,'text-anchor':anchor}),html.escape(s))
def rect(x,y,w,h,cls='box',rx=3):return tag('rect',dict(x=x,y=y,width=w,height=h,rx=rx,**{'class':cls}))
def line(x1,y1,x2,y2,cls='line'):return tag('path',dict(d=f'M{x1} {y1} L{x2} {y2}',**{'class':cls}))
def path(d,cls='line'):return tag('path',dict(d=d,**{'class':cls}))
def circle(x,y,r,cls='line'):return tag('circle',dict(cx=x,cy=y,r=r,**{'class':cls}))
def arrow(x1,y1,x2,y2):return tag('path',dict(d=f'M{x1} {y1} L{x2} {y2}',**{'class':'accent','marker-end':'url(#arrow)'}))
def card(x,y,w,h,title,sub=''):
 return rect(x,y,w,h)+text(x+22,y+42,title,25)+ (text(x+22,y+76,sub,17,'quiet') if sub else '')
def check(x,y):return path(f'M{x} {y} l8 8 l18 -21','accent')
def bars(x,y,w,n=4):return ''.join(line(x,y+15*j,x+w*(.7 if j==n-1 else 1),y+15*j,'faint') for j in range(n))
def clock(x,y,label):return circle(x,y,67)+path(f'M{x} {y-43} V{y} H{x-34}','accent')+circle(x,y,4,'dot')+text(x,y+106,label,22,anchor='middle')
def drawing(i):
 if i==0:
  return card(70,25,245,180,'Customer','$100 returned')+card(565,25,300,180,'Business','Original fee remains')+arrow(565,110,335,110)+text(440,88,'refund',19,'quiet','middle')+line(590,152,835,152,'faint')+text(590,185,'sale reversed · fee retained',17,'quiet')
 if i==1:
  return card(65,30,230,155,'Submitted','One purchase')+card(620,30,250,155,'Processed','Record to confirm')+arrow(310,75,600,75)+path('M615 140 H485 M440 140 H310','faint')+path('M455 127 l16 26 M471 127 l-16 26','accent')+text(455,198,'confirmation interrupted',20,'quiet','middle')+path('M180 200 V235 H745 V200','accent')+text(460,269,'check the same operation',25,anchor='middle')
 if i==2:
  return clock(195,95,'Before the change')+clock(725,95,'After the change')+arrow(290,95,630,95)+text(460,65,'same local time',24,anchor='middle')+text(460,140,'time-zone rules',19,'quiet','middle')+text(460,251,'09:00 · one recurring appointment',26,anchor='middle')
 if i==3:
  return (card(55,20,330,185,'One exported file','Sent to the next person')
   +bars(85,108,220,2)
   +rect(85,140,165,56)+''.join(line(x,188,x,188-h,'faint') for x,h in ((108,20),(133,36),(158,14),(183,30),(208,24)))
   +arrow(400,112,470,112)
   +check(510,58)+text(550,63,'It opens',23)
   +check(510,112)+text(550,117,'It looks right',23)
   +path('M512 153 l16 26 M528 153 l-16 26','accent')+text(550,171,'The chart is a picture',23)
   +text(470,272,'the next task is the test',25,anchor='middle'))
 if i==4:
  return rect(180,0,560,255)+bars(225,45,180,10)+bars(495,45,180,10)+arrow(435,30,435,195)+path('M435 205 V230 H700 V15','accent')+text(460,297,'one column, then the next',25,anchor='middle')
 if i==5:
  return rect(60,10,815,235,'boundary')+card(85,55,205,130,'Read','Source content')+card(355,55,205,130,'Draft','Proposed action')+card(650,55,200,130,'Send','Authorized action')+arrow(300,115,340,115)+arrow(575,115,630,115)+line(610,15,610,235,'dash')+text(470,277,'review the actual action',25,anchor='middle')
 if i==6:
  return card(80,15,310,225,'Conversation','What the agent said')+bars(105,120,230,4)+arrow(410,125,495,125)+card(515,15,340,225,'System state','What actually changed')+check(545,135)+text(585,140,'correct record',21)+check(545,183)+text(585,188,'expected result',21)
 if i==7:
  return card(100,35,300,190,'Guided practice','Assistance available')+bars(130,135,160,4)+arrow(420,128,520,128)+card(540,35,300,190,'Independent work','Help removed')+rect(570,130,60,45)+rect(650,130,60,45)+line(720,152,800,152,'faint')+text(470,278,'measure each outcome separately',25,anchor='middle')
 if i==8:
  return (''.join(circle(x,80,42)+text(x,88,str(n),26,anchor='middle')+text(x,164,a,24,anchor='middle')+text(x,200,b,18,'quiet','middle') for x,n,a,b in [(150,1,'Study','Meet the idea'),(430,2,'Recall','Try without the text'),(820,3,'Return','Check after a delay')])
   +arrow(198,80,382,80)+arrow(478,80,772,80)
   +text(625,62,'two days, then a week',19,'quiet','middle')
   +text(470,268,'the delay is part of the test',25,anchor='middle'))
 if i==9:
  return ''.join(line(80,40+j*33,370,40+j*33,'faint') for j in range(6))+path('M80 139 H370 L510 139','accent')+text(220,265,'alternatives tried',23,anchor='middle')+arrow(520,139,620,139)+rect(650,35,210,200)+text(755,125,'New data',26,anchor='middle')+text(755,160,'evaluation',18,'quiet','middle')+text(470,15,'keep the search history',20,'quiet','middle')
 # Two sources of direction, weighted against each other, which is the post's actual claim:
 # a finished list says less about what to change than an hour of use does. The connector
 # carries that, dashed from the list and accented from the use.
 return (card(55,18,300,172,'Completed tasks','Each one built as asked')
  +''.join(check(82,122+26*j)+line(122,124+26*j,325,124+26*j,'faint') for j in range(3))
  +card(585,18,300,172,'An hour using it','Where the work goes slowly')
  +''.join(rect(x,108,56,40) for x in (610,700,790))
  +arrow(672,128,694,128)
  +path('M756 128 C 766 180, 782 180, 788 134','accent')+circle(771,174,3.5,'dot')
  +path('M205 190 V236 H470','dash')
  +path('M735 190 V236 H470','accent')
  +arrow(470,236,470,264)
  +text(470,302,'what to change next',25,anchor='middle'))
style='''*{box-sizing:border-box;margin:0}html,body{background:#e9ecea}.sheet{position:relative;width:var(--w);height:var(--h);overflow:hidden;background:#e2e8e3}.sheet img{position:absolute;width:100%;height:100%;object-fit:cover;filter:saturate(.45)}.wash{position:absolute;inset:0;background:linear-gradient(140deg,rgba(235,239,233,.82),rgba(230,236,232,.93))}svg{position:absolute;inset:0;width:100%;height:100%}text{font-family:Georgia,serif;fill:#293d37}.quiet,.eyebrow{font-family:Arial,sans-serif;fill:#5c746c}.eyebrow{letter-spacing:3px;font-size:13px}.box{fill:#f6f7ef;fill-opacity:.68;stroke:#637b71;stroke-width:1.3}.boundary{fill:none;stroke:#9aafa5;stroke-width:1;stroke-dasharray:4 7}.line{fill:none;stroke:#526d62;stroke-width:1.8}.accent{fill:none;stroke:#437c70;stroke-width:2}.faint{fill:none;stroke:#81978b;stroke-width:1.4;opacity:.65}.dash{fill:none;stroke:#437c70;stroke-width:1.5;stroke-dasharray:5 5}.dot{fill:#437c70}.registration{fill:none;stroke:#8da196;stroke-width:1}'''
for d in items:
 i=d['index']; art=drawing(i)
 doc=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{html.escape(d['title'])}</title><style>{style}</style></head><body><div class="sheet"><img src="{['ph-offline.jpg','ph-slot.jpg','ph-map.jpg','ph-engine.jpg','ph-anchor.jpg'][i%5]}" alt=""><div class="wash"></div><svg id="plate" xmlns="http://www.w3.org/2000/svg"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1 L7 4 L1 7" fill="none" stroke="#437c70" stroke-width="1"/></marker></defs><g id="content">{text(60,0,d['topic'].upper(),13,'eyebrow')}{tag('g',{'transform':'translate(0 35)'},art)}</g></svg></div><script>const [w,h]=(location.hash.slice(1)||'2000x769').split('x').map(Number);document.querySelector('.sheet').style.cssText=`--w:${{w}}px;--h:${{h}}px`;const wide=w/h>2;document.querySelector('svg').setAttribute('viewBox',`0 0 940 ${{wide?384:627}}`);document.getElementById('content').setAttribute('transform',`translate(0 ${{wide?32:145}})`);</script></body></html>'''
 (HERE/(d['slug']+'.html')).write_text(doc)
print('Generated',len(items),'distinct cover plates')
