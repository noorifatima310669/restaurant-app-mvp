"""Generate real document PDFs/vector diagrams; never fabricate app evidence.
Run at the existing project root after installing reportlab and pypdf.
"""
from pathlib import Path
import sys,re,html
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.tools'))
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,LongTable,TableStyle,Preformatted,PageBreak
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing,Rect,String,Line,Polygon
from reportlab.graphics import renderSVG,renderPDF
from pypdf import PdfReader,PdfWriter
A2=ROOT/'A2'; DIAGRAMS=A2/'diagrams'; DIAGRAMS.mkdir(exist_ok=True)
font='Helvetica'
font_path=Path('C:/Windows/Fonts/arial.ttf')
if font_path.exists():
 pdfmetrics.registerFont(TTFont('UrbanArial',str(font_path)));font='UrbanArial'
PURPLE=colors.HexColor('#4B2142');PEACH=colors.HexColor('#F28C6B');PALE=colors.HexColor('#FFF8F2')
def box(d,x,y,w,h,title,lines=()):
 d.add(Rect(x,y,w,h,rx=12,ry=12,fillColor=PALE,strokeColor=PURPLE,strokeWidth=1.5))
 d.add(String(x+w/2,y+h-24,title,fontName=font,fontSize=13,fillColor=PURPLE,textAnchor='middle'))
 for i,line in enumerate(lines):d.add(String(x+w/2,y+h-44-i*16,line,fontName=font,fontSize=10,fillColor=colors.black,textAnchor='middle'))
def arrow(d,x1,y1,x2,y2,label='',size=10):
 d.add(Line(x1,y1,x2,y2,strokeColor=PURPLE,strokeWidth=1.2))
 import math
 angle=math.atan2(y2-y1,x2-x1);length=7
 tip1=(x2-length*math.cos(angle-0.45),y2-length*math.sin(angle-0.45))
 tip2=(x2-length*math.cos(angle+0.45),y2-length*math.sin(angle+0.45))
 d.add(Polygon([x2,y2,*tip1,*tip2],fillColor=PURPLE,strokeColor=PURPLE))
 if label:d.add(String((x1+x2)/2,(y1+y2)/2+8,label,fontName=font,fontSize=size,fillColor=colors.black,textAnchor='middle'))
def sequence():
 d=Drawing(780,740)
 d.add(String(28,710,'Customer places an order - Assignment 2',fontName=font,fontSize=20,fillColor=PURPLE))
 actors=[(90,'Customer'),(260,'Existing Expo App'),(495,'Express Server'),(690,'MongoDB')]
 for x,label in actors:
  box(d,x-74,622,148,53,label)
  d.add(Line(x,621,x,55,strokeColor=colors.grey,strokeDashArray=[5,5]))
 steps=[(0,1,'Confirm order'),(1,2,'POST /orders + JWT + item IDs'),(2,3,'Read current menu prices / table'),(3,2,'Prices, availability and capacity'),(2,2,'Validate; calculate server total'),(2,3,'Insert Pending order / price snapshots'),(3,2,'Saved order'),(2,1,'201 + authoritative order / total'),(1,1,'Clear cart only after success'),(1,0,'Show confirmation'),(1,2,'GET /orders/my every 10 seconds'),(2,3,'Query authenticated customer orders'),(3,2,'Latest manager-controlled status'),(2,1,'200 + order list')]
 y=593
 for a,b,label in steps:
  x1,x2=actors[a][0],actors[b][0]
  if a==b:
   d.add(Line(x1,y,x1+38,y,strokeColor=PURPLE));d.add(Line(x1+38,y,x1+38,y-16,strokeColor=PURPLE));arrow(d,x1+38,y-16,x1,y-16)
   d.add(String(x1+45,y-10,label,fontName=font,fontSize=9,fillColor=PURPLE))
  else:arrow(d,x1,y,x2,y,label,size=9)
  y-=37
 d.add(String(30,25,'Failed POST retains cart. Statuses never advance from local demo timers.',fontName=font,fontSize=10,fillColor=PURPLE))
 return d
def deployment():
 d=Drawing(780,390)
 d.add(String(28,355,'Deployment - Phone, Laptop and MongoDB Atlas',fontName=font,fontSize=20,fillColor=PURPLE))
 box(d,25,148,205,115,'Customer / Manager Phone',['Existing Expo app','Auth, cart and UI','BASE_URL = laptop LAN IP'])
 box(d,285,148,210,115,'Laptop / Express',['0.0.0.0 : 5000','JWT / roles / validation','Controllers + Mongoose'])
 box(d,550,148,205,115,'MongoDB Atlas',['Users / MenuItems / Tables','Reservations / Orders','Shared authoritative records'])
 arrow(d,230,232,285,232,'HTTP',size=8);arrow(d,495,232,550,232,'TLS',size=8)
 arrow(d,285,180,230,180,'JSON',size=8);arrow(d,550,180,495,180,'Data',size=8)
 d.add(String(25,105,'Phone -> Laptop: JSON REST requests + Bearer token; same Wi-Fi / permitted firewall port.',fontName=font,fontSize=11,fillColor=PURPLE))
 d.add(String(25,82,'Laptop -> Atlas: private MONGO_URI stays in ignored server/.env; never bundled in the app.',fontName=font,fontSize=11,fillColor=PURPLE))
 d.add(String(25,59,'Orders poll every exactly 10 seconds. Atlas / physical-device verification remains manual.',fontName=font,fontSize=11,fillColor=PURPLE))
 return d
pdfs=[]
for name,drawing in [('order-sequence',sequence()),('deployment',deployment())]:
 renderSVG.drawToFile(drawing,str(DIAGRAMS/(name+'.svg')))
 renderPDF.drawToFile(drawing,str(DIAGRAMS/(name+'.pdf')))
 pdfs.append(DIAGRAMS/(name+'.pdf'))
writer=PdfWriter()
for path in pdfs:writer.append(str(path))
with (DIAGRAMS/'A2_Diagrams.pdf').open('wb') as f:writer.write(f)
styles=getSampleStyleSheet()
for name in ['Normal','BodyText','Heading1','Heading2','Heading3','Title']:
 styles[name].fontName=font
styles['BodyText'].fontSize=9;styles['BodyText'].leading=13;styles['BodyText'].spaceAfter=5
styles['Heading1'].fontSize=17;styles['Heading1'].textColor=PURPLE
styles['Heading2'].fontSize=14;styles['Heading2'].textColor=PURPLE
styles['Heading3'].fontSize=11;styles['Heading3'].textColor=PURPLE
cellstyle=ParagraphStyle('Cell',parent=styles['BodyText'],fontSize=8,leading=11,spaceAfter=0)
def inline(text):
 text=html.escape(text)
 text=re.sub(r'`([^`]+)`',r'<font color="#4B2142">\1</font>',text)
 return text
story=[];lines=(A2/'SRS_v2.md').read_text(encoding='utf-8').splitlines();i=0
while i<len(lines):
 line=lines[i].strip()
 if not line:i+=1;continue
 if line.startswith('```'):
  block=[];i+=1
  while i<len(lines) and not lines[i].startswith('```'):
   # Wrap lengthy JSON sample lines for the printable page.
   import textwrap
   block.extend(textwrap.wrap(lines[i],width=83,break_long_words=True,replace_whitespace=False));i+=1
  story.append(Preformatted('\n'.join(block),ParagraphStyle('Code',fontName='Courier',fontSize=8,leading=11)));i+=1;continue
 if line.startswith('|'):
  rows=[]
  while i<len(lines) and lines[i].strip().startswith('|'):
   row=[s.strip() for s in lines[i].strip().strip('|').split('|')]
   if not all(re.fullmatch(r'[-: ]+',s) for s in row):rows.append(row)
   i+=1
  n=max(len(row) for row in rows);widths=[(495/n)]*n
  if n==3:widths=[108,58,329]
  if n==5:widths=[38,106,69,79,203]
  cells=[[Paragraph(inline(value),cellstyle) for value in row+['']*(n-len(row))] for row in rows]
  table=LongTable(cells,colWidths=widths,repeatRows=1,hAlign='LEFT')
  table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#F3EAE6')),('GRID',(0,0),(-1,-1),0.3,colors.HexColor('#E9DDD8')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
  story.extend([table,Spacer(1,10)]);continue
 if line.startswith('#'):
  level=len(line)-len(line.lstrip('#'));title=line[level:].strip()
  story.append(Paragraph(inline(title),styles['Title' if level==1 else 'Heading'+str(min(level-1,3))]));i+=1;continue
 story.append(Paragraph(inline(line),styles['BodyText']));i+=1

def footer(canvas,doc):
 canvas.saveState();canvas.setFont(font,8);canvas.setFillColor(PURPLE)
 canvas.drawString(50,30,'Urban Fork | Assignment 2 | SRS v2 | Fall 2026')
 canvas.drawRightString(545,30,str(doc.page));canvas.restoreState()
body=A2/'SRS_v2_body.pdf'
SimpleDocTemplate(str(body),pagesize=(595,842),rightMargin=50,leftMargin=50,topMargin=48,bottomMargin=50,title='Urban Fork SRS v2',author='Urban Fork').build(story,onFirstPage=footer,onLaterPages=footer)
writer=PdfWriter();writer.append(str(body));writer.append(str(DIAGRAMS/'A2_Diagrams.pdf'))
with (A2/'SRS_v2.pdf').open('wb') as f:writer.write(f)
body.unlink()
print('Generated SRS_v2.pdf:',len(PdfReader(str(A2/'SRS_v2.pdf')).pages),'pages; vector SVG/PDF diagrams generated.')
