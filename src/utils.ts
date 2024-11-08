

export const randomNumber = ( min : number, max : number ) : number => Math.random() * ( max - min ) + min;

export const formatSeconds = ( secNum : number ) : string => {
    secNum = Math.round( secNum );
    const hours : number = Math.floor( secNum / 3600);
    const minutes : number = Math.floor( ( secNum - ( hours * 3600 ) ) / 60 );
    const seconds : number = secNum - ( hours * 3600 ) - ( minutes * 60 );
    return [
        ( hours < 10 ? '0' : '' ) + hours + 'h',
        ( minutes < 10 ? '0' : '' ) + minutes + 'm',
        ( seconds < 10 ? '0' : '' ) + seconds + 's',
    ].join( ' ' );
};