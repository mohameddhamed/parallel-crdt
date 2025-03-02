import * as vscode from "vscode";
import { Position } from "../models/EditorStructs";
import { get } from "http";

export function isCursor(selection: vscode.Selection): boolean {
  return (
    selection.start.line === selection.end.line &&
    selection.start.character === selection.end.character
  );
}
export function convertVsCodePositionToPosition(
  position: vscode.Position
): Position {
  return new Position(position.line, position.character);
}

export function convertPositionToVsCodePosition(
  position: Position
): vscode.Position {
  return new vscode.Position(position.row, position.column);
}

export function getRandomColor(): string {
  return `rgba(${getRandomInt(0, 255)}, ${getRandomInt(0, 255)}, ${getRandomInt(
    0,
    255
  )}, 0.4)`; // 0.4 is the opacity
}

export function getRandomInt(max: number, min: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getVsCodeRange(start: Position, end: Position): vscode.Range {
  return new vscode.Range(
    convertPositionToVsCodePosition(start),
    convertPositionToVsCodePosition(end)
  );
}

export function getIndexFromPosition(text: string, position: Position): number {
  let line = 0,
    character = 0;
  for (let i = 0; i < text.length; i++) {
    if (line == position.row && character == position.column) {
      return i;
    }
    const { row, column } = getRowAndColFromIndex(text, i, character, line);
    line = row;
    character = column;
  }
  return text.length;
}

export function getPositionFromIndex(text: string, index: number): Position {
  let line = 0,
    character = 0;

  for (let i = 0; i < Math.min(index, text.length); i++) {
    const { row, column } = getRowAndColFromIndex(text, i, character, line);
    line = row;
    character = column;
  }
  return new Position(line, character);
}

export function getRowAndColFromIndex(
  text: string,
  index: number,
  startingColumn: number = 0,
  startingRow: number = 0
): { row: number; column: number } {
  // If the character at the current index i is a carriage return (\r),
  if (text.charAt(index) == "\r") {
    // checks if the next character is a newline (\n).
    if (!(index + 1 < text.length) || text.charAt(index + 1) != "\n") {
      // it increments the line number and resets the character position to 0.
      startingRow++;
      startingColumn = 0;
    }
    // If the character at the current index i is a newline (\n),
  } else if (text.charAt(index) == "\n") {
    // it increments the line number and resets the character position to 0.
    startingRow++;
    startingColumn = 0;
  } else {
    // Otherwise, it increments the character position.
    startingColumn++;
  }
  return { row: startingRow, column: startingColumn };
}
