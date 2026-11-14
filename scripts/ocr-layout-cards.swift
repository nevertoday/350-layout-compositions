#!/usr/bin/env swift

import AppKit
import Foundation
import Vision

struct OCRLine: Codable {
    let text: String
    let confidence: Float
    let x: Double
    let y: Double
    let width: Double
    let height: Double
}

struct OCRDocument: Codable {
    let path: String
    let lines: [OCRLine]
}

func recognize(_ imageURL: URL) throws -> OCRDocument {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    let supportedLanguages = try request.supportedRecognitionLanguages()
    request.recognitionLanguages = ["zh-Hans", "en-US"].filter { supportedLanguages.contains($0) }
    request.usesLanguageCorrection = true
    request.minimumTextHeight = 0.008
    request.usesCPUOnly = true

    guard let image = NSImage(contentsOf: imageURL) else {
        throw NSError(domain: "LayoutOCR", code: 1, userInfo: [NSLocalizedDescriptionKey: "cannot load image"])
    }
    var proposedRect = CGRect(origin: .zero, size: image.size)
    guard let cgImage = image.cgImage(forProposedRect: &proposedRect, context: nil, hints: nil) else {
        throw NSError(domain: "LayoutOCR", code: 2, userInfo: [NSLocalizedDescriptionKey: "cannot create CGImage"])
    }
    let handler = VNImageRequestHandler(cgImage: cgImage, orientation: .up, options: [:])
    try handler.perform([request])

    let lines = (request.results ?? []).compactMap { observation -> OCRLine? in
        guard let candidate = observation.topCandidates(1).first else { return nil }
        let box = observation.boundingBox
        return OCRLine(
            text: candidate.string,
            confidence: candidate.confidence,
            x: box.origin.x,
            y: box.origin.y,
            width: box.size.width,
            height: box.size.height
        )
    }

    return OCRDocument(path: imageURL.path, lines: lines)
}

let arguments = Array(CommandLine.arguments.dropFirst())
guard !arguments.isEmpty else {
    FileHandle.standardError.write(Data("usage: ocr-layout-cards <image-or-directory> [...]\n".utf8))
    exit(2)
}

let fileManager = FileManager.default
var imageURLs: [URL] = []

for argument in arguments {
    let url = URL(fileURLWithPath: argument)
    var isDirectory: ObjCBool = false
    guard fileManager.fileExists(atPath: url.path, isDirectory: &isDirectory) else { continue }
    if isDirectory.boolValue {
        let enumerator = fileManager.enumerator(
            at: url,
            includingPropertiesForKeys: [.isRegularFileKey],
            options: [.skipsHiddenFiles]
        )
        while let child = enumerator?.nextObject() as? URL {
            if ["png", "jpg", "jpeg"].contains(child.pathExtension.lowercased()) {
                imageURLs.append(child)
            }
        }
    } else {
        imageURLs.append(url)
    }
}

imageURLs.sort { $0.path < $1.path }
let encoder = JSONEncoder()
encoder.outputFormatting = [.withoutEscapingSlashes]

for imageURL in imageURLs {
    do {
        let document = try recognize(imageURL)
        let data = try encoder.encode(document)
        FileHandle.standardOutput.write(data)
        FileHandle.standardOutput.write(Data("\n".utf8))
    } catch {
        let nsError = error as NSError
        FileHandle.standardError.write(
            Data("OCR failed: \(imageURL.path): domain=\(nsError.domain) code=\(nsError.code) info=\(nsError.userInfo)\n".utf8)
        )
    }
}
