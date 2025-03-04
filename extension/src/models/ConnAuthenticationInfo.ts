export class ConnAuthenticationInfo {
  constructor(
    public username: string,
    public roomName: string,
    public password: string | null = null
  ) {}
}
