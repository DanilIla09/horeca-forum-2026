// Вырезает человека с фона (Vision: выделение объекта переднего плана) и находит лицо.
// swift cutout.swift <входное фото> <выход.png>  → печатает JSON: размер и рамку лица (в пикселях, начало сверху слева)
import Foundation
import Vision
import CoreImage
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count >= 3 else { print("usage: cutout.swift in out.png"); exit(1) }
let inURL = URL(fileURLWithPath: args[1]), outURL = URL(fileURLWithPath: args[2])

// читаем с учётом поворота из EXIF и уменьшаем до 2000 px по длинной стороне
guard let src = CGImageSourceCreateWithURL(inURL as CFURL, nil) else { print("{\"error\":\"open\"}"); exit(1) }
let opts: [CFString: Any] = [kCGImageSourceCreateThumbnailFromImageAlways: true, kCGImageSourceCreateThumbnailWithTransform: true, kCGImageSourceThumbnailMaxPixelSize: 2000]
guard let cg = CGImageSourceCreateThumbnailAtIndex(src, 0, opts as CFDictionary) else { print("{\"error\":\"decode\"}"); exit(1) }
let W = cg.width, H = cg.height

let handler = VNImageRequestHandler(cgImage: cg, options: [:])
let faceReq = VNDetectFaceRectanglesRequest()
let maskReq = VNGenerateForegroundInstanceMaskRequest()
do { try handler.perform([faceReq, maskReq]) } catch { print("{\"error\":\"vision: \(error.localizedDescription)\"}"); exit(1) }

// самое крупное лицо
var face = CGRect.zero
if let f = (faceReq.results ?? []).max(by: { $0.boundingBox.width * $0.boundingBox.height < $1.boundingBox.width * $1.boundingBox.height }) {
    let b = f.boundingBox
    face = CGRect(x: b.minX * CGFloat(W), y: (1 - b.maxY) * CGFloat(H), width: b.width * CGFloat(W), height: b.height * CGFloat(H))
}
guard let obs = maskReq.results?.first else { print("{\"error\":\"no foreground\"}"); exit(1) }

// берём только тот объект, которому принадлежит лицо (а не вывеску или ноутбук рядом)
var chosen = obs.allInstances
if face.width > 0 {
    let im = obs.instanceMask
    CVPixelBufferLockBaseAddress(im, .readOnly)
    let mw = CVPixelBufferGetWidth(im), mh = CVPixelBufferGetHeight(im), bpr = CVPixelBufferGetBytesPerRow(im)
    if let base = CVPixelBufferGetBaseAddress(im) {
        let px = min(mw - 1, max(0, Int(face.midX / CGFloat(W) * CGFloat(mw)))), py = min(mh - 1, max(0, Int(face.midY / CGFloat(H) * CGFloat(mh))))
        let id = Int(base.load(fromByteOffset: py * bpr + px, as: UInt8.self))
        if id > 0 { chosen = IndexSet(integer: id) }
    }
    CVPixelBufferUnlockBaseAddress(im, .readOnly)
}
do {
    let pb = try obs.generateMaskedImage(ofInstances: chosen, from: handler, croppedToInstancesExtent: false)
    let ci = CIImage(cvPixelBuffer: pb)
    let ctx = CIContext()
    try ctx.writePNGRepresentation(of: ci, to: outURL, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
} catch { print("{\"error\":\"mask: \(error.localizedDescription)\"}"); exit(1) }
print("{\"w\":\(W),\"h\":\(H),\"instances\":\(obs.allInstances.count),\"chosen\":\(chosen.count),\"face\":[\(Int(face.minX)),\(Int(face.minY)),\(Int(face.width)),\(Int(face.height))]}")
