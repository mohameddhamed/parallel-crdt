export class Position {
  constructor(public row: number, public column: number) {}
}

export class Selection {
  constructor(
    public id: string,
    public reversed: boolean,
    public isCursor: boolean,
    public start: Position,
    public end: Position
  ) {}
}

export enum TextChangeType {
  INSERT,
  DELETE,
  UPDATE,
}

export class TextChange {
  constructor(
    public type: TextChangeType,
    public start: Position,
    public end: Position,
    public text: string
  ) {}
}

export class PeerSelection {
  constructor(public peerName: string, public selection: Selection) {}
}
