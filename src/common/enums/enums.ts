
export enum SenderEnum {
    me = "ME",
    debot = "DEBOT"
}

export enum MessageEnum {
    string = "STRING",
    menu = "MENU"
}

export enum MessageTypeEnum {
    string = "STRING",
    qr = "QR",
    img = "IMG",
    confirmNo = 'CONFIRM_NO',
    confirmYes = 'CONFIRM_YES'
}

export enum CurrentInput {
    menu = "MENU",
    stringInput = "STRING_INPUT",
    confirmInput = "CONFIRM_INPUT",
    dateTimeInput = 'DATE_TIME_INPUT',
    null = "NULL"
}

export enum InterfaceIDs {
    menu = 'ac1a4d3ecea232e49783df4a23a81823cdca3205dc58cd20c4db259c25605b48',
    terminal = '8796536366ee21852db56dccb60bc564598b618c865fc50c8b1ab740bba128e3',
    addressInput = 'd7ed1bd8e6230871116f4522e58df0a93c5520c56f4ade23ef3d8919a984653b',
    amountInput = 'a1d347099e29c1624c8890619daf207bde18e92df5220a54bcc6d858309ece84',
    confirmInput = '16653eaf34c921467120f2685d425ff963db5cbb5aa676a62a2e33bfc3f6828a',
    signingBox = 'c13024e101c95e71afb1f5fa6d72f633d51e721de0320d73dfd6121a54e4d40a',
    dateTimeInput = '4e862a9df81183ab425bdf0fbd76bd0b558c7f44c24887b4354bf1c26c74a623',
    numberInput = 'c5a9558b2664aed7dc3e6123436d544f13ffe69ab0e259412f48c6d1c8588401'
}