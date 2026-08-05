"use client"; import {useState} from "react"; import Image from "next/image";
export function ProductGallery({images,name}:{images:string[];name:string}){
  const [selected,setSelected]=useState(0);
  return <div>
    <div className="relative aspect-square overflow-hidden border border-loom bg-loom/30">
      <Image src={images[selected]} alt={`Fabric sample: ${name}`} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover"/>
    </div>
    {images.length>1&&<div className="mt-3 grid grid-cols-4 gap-2">
      {images.map((image,index)=>({image,index})).filter(({index})=>index!==selected).map(({image,index})=><button key={image} type="button" onClick={()=>setSelected(index)} className="relative aspect-square overflow-hidden border border-loom">
        <Image src={image} alt={`${name} image ${index+1}`} fill sizes="120px" className="object-cover"/>
      </button>)}
    </div>}
  </div>;
}
