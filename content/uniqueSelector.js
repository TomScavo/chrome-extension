
/**
 * Generate unique CSS selector for given DOM element
 *
 * @param {Element} el
 * @return {String}
 * @api private
 */

function uniqueSelector( el, options={} ) {
  function getAttributes( el, attributesToIgnore = ['id', 'class', 'length'] )
{
  const { attributes } = el;
  const attrs = [ ...attributes ];

  return attrs.reduce( ( sum, next ) =>
  {
    if ( ! ( attributesToIgnore.indexOf( next.nodeName ) > -1 ) )
    {
      sum.push( `[${next.nodeName}="${next.value}"]` );
    }
    return sum;
  }, [] );
}

function getClasses( el ) {
  if( !el.hasAttribute( 'class' ) )
  {
    return [];
  }

    try {
      let classList = Array.prototype.slice.call( el.classList )

      // return only the valid CSS selectors based on RegEx
      return classList.filter(item => !/^[a-z_-][a-z\d_-]*$/i.test( item ) ? null : item );
    } catch (e) {
      let className = el.getAttribute( 'class' );

    // remove duplicate and leading/trailing whitespaces
    className = className.trim().replace( /\s+/g, ' ' );

    // split into separate classnames
    return className.split( ' ' );
  }
}

function kCombinations( result, items, data, start, end, index, k )
{
    if( index === k )
    {
        result.push( data.slice( 0, index ).join( '' ) );
        return;
    }

    for( let i = start; i <= end && end - i + 1 >= k - index; ++i )
    {
        data[index] = items[i];
        kCombinations( result, items, data, i + 1, end, index + 1, k );
    }
}

function getCombinations( items, k )
{
    const result = [],
          n = items.length,
          data = [];

    for( var l = 1; l <= k; ++l )
    {
        kCombinations( result, items, data, 0, n - 1, 0, l );
    }

    return result;
}

function getID( el )
{
  const id = el.getAttribute( 'id' );

  if( id !== null && id !== '')
  {
    // if the ID starts with a number or contains ":" selecting with a hash will cause a DOMException
    return id.match(/(?:^\d|:)/) ? `[id="${id}"]` : '#' + id;
  }
  return null;
}

function getTag( el )
{
  return el.tagName.toLowerCase().replace(/:/g, '\\:');
}

function isElement( el )
{
  let isElem;

  if ( typeof HTMLElement === 'object' )
  {
    isElem = el instanceof HTMLElement;
  }
  else
  {
    isElem = !!el && ( typeof el === 'object' ) && el.nodeType === 1 && typeof el.nodeName === 'string';
  }
  return isElem;
}

function isUnique( el, selector )
{
  if( !Boolean( selector ) ) return false;
  const elems = el.ownerDocument.querySelectorAll( selector );
  return elems.length === 1 && elems[ 0 ] === el;
}



function getNthChild( element )
{
  let counter = 0;
  let k;
  let sibling;
  const { parentNode } = element;

  if( Boolean( parentNode ) )
  {
    const { childNodes } = parentNode;
    const len = childNodes.length;
    for ( k = 0; k < len; k++ )
    {
      sibling = childNodes[ k ];
      if( isElement( sibling ) )
      {
        counter++;
        if( sibling === element )
        {
          return `:nth-child(${counter})`;
        }
      }
    }
  }
  return null;
}

function getParents( el )
{
  const parents = [];
  let currentElement = el;
  while( isElement( currentElement ) )
  {
    parents.push( currentElement );
    currentElement = currentElement.parentNode;
  }

  return parents;
}


/**
 * Returns the Class selectors of the element
 * @param  { Object } element
 * @return { Array }
 */
function getClassSelectors( el )
{
  const classList = getClasses( el ).filter( Boolean );
  return classList.map( cl => `.${cl}` );
}


/**
 * Returns all the selectors of the elmenet
 * @param  { Object } element
 * @return { Object }
 */
function getAllSelectors( el, selectors, attributesToIgnore )
{
  const funcs =
    {
      'Tag'        : getTag,
      'NthChild'   : getNthChild,
      'Attributes' : elem => getAttributes( elem, attributesToIgnore ),
      'Class'      : getClassSelectors,
      'ID'         : getID,
    };

  return selectors.reduce( ( res, next ) =>
  {
    res[ next ] = funcs[ next ]( el );
    return res;
  }, {} );
}

/**
 * Tests uniqueNess of the element inside its parent
 * @param  { Object } element
 * @param { String } Selectors
 * @return { Boolean }
 */
function testUniqueness( element, selector )
{
  const { parentNode } = element;
  const elements = parentNode.querySelectorAll( selector );
  return elements.length === 1 && elements[ 0 ] === element;
}

/**
 * Tests all selectors for uniqueness and returns the first unique selector.
 * @param  { Object } element
 * @param  { Array } selectors
 * @return { String }
 */
function getFirstUnique( element, selectors )
{
    return selectors.find( testUniqueness.bind( null, element ) );
}

/**
 * Checks all the possible selectors of an element to find one unique and return it
 * @param  { Object } element
 * @param  { Array } items
 * @param  { String } tag
 * @return { String }
 */
function getUniqueCombination( element, items, tag )
{
  let combinations = getCombinations( items, 3 ),
      firstUnique = getFirstUnique( element, combinations );

  if( Boolean( firstUnique ) )
  {
      return firstUnique;
  }

  if( Boolean( tag ) )
  {
      combinations = combinations.map( combination => tag + combination );
      firstUnique = getFirstUnique( element, combinations );

      if( Boolean( firstUnique ) )
      {
          return firstUnique;
      }
  }

  return null;
}

/**
 * Returns a uniqueSelector based on the passed options
 * @param  { DOM } element
 * @param  { Array } options
 * @return { String }
 */
function getUniqueSelector( element, selectorTypes, attributesToIgnore, excludeRegex )
{
  let foundSelector;

  const elementSelectors = getAllSelectors( element, selectorTypes, attributesToIgnore );

  if( excludeRegex && excludeRegex instanceof RegExp )
  {
    elementSelectors.ID = excludeRegex.test( elementSelectors.ID ) ? null : elementSelectors.ID;
    elementSelectors.Class = elementSelectors.Class.filter( className => !excludeRegex.test( className ) );
  }

  for( let selectorType of selectorTypes )
  {
      const { ID, Tag, Class : Classes, Attributes, NthChild } = elementSelectors;
      switch ( selectorType )
      {
        case 'ID' :
        if ( Boolean( ID ) && testUniqueness( element, ID ) )
        {
            return ID;
        }
        break;

        case 'Tag':
          if ( Boolean( Tag ) && testUniqueness( element, Tag ) )
          {
              return Tag;
          }
          break;

        case 'Class':
          if ( Boolean( Classes ) && Classes.length )
          {
            foundSelector = getUniqueCombination( element, Classes, Tag );
            if (foundSelector) {
              return foundSelector;
            }
          }
          break;

        case 'Attributes':
          if ( Boolean( Attributes ) && Attributes.length )
          {
            foundSelector = getUniqueCombination( element, Attributes, Tag );
            if ( foundSelector )
            {
              return foundSelector;
            }
          }
          break;

        case 'NthChild':
          if ( Boolean( NthChild ) )
          {
            return NthChild
          }
      }
  }
  return '*';
}


  const {
    selectorTypes = ['ID', 'Class', 'Tag', 'NthChild'],
    attributesToIgnore = ['id', 'class', 'length'],
    excludeRegex = null,
  } = options;
  const allSelectors = [];
  const parents = getParents( el );

  for( let elem of parents )
  {
    const selector = getUniqueSelector( elem, selectorTypes, attributesToIgnore, excludeRegex );
    if( Boolean( selector ) )
    {
      allSelectors.push( selector );
    }
  }

  const selectors = [];
  for( let it of allSelectors )
  {
    selectors.unshift( it );
    const selector = selectors.join( ' > ' );
    if( isUnique( el, selector ) )
    {
      return selector;
    }
  }

  return null;
}
