import React from 'react';
import './MinesweeperHeader.css';
import {Link, useLocation} from 'react-router-dom';

/**
 * Displays the Header containing a link to the
 * Minesweeper game and a link to load a Minesweeper game
 * @return {JSX.Element} The Header NavBar that redirects
 * the user to the Load Component and the Minesweeper game Component
 */
export default function Header() {
  const location = useLocation();
  const url = '/minesweeper';

  return (
    <div className="minesweeper-header">
      <ul className="header-left">
        <li className="logo">
          {(location.pathname === (url)) ?
            <Link to={url + '/game'}>Minesweeper</Link> :
            <p className='logo-text'>Minesweeper</p>
          }
        </li>
      </ul>

      <ul className="header-right">
        <li className='load'>
          <Link data-testid="load-link" to={url}>Load</Link>
        </li>
      </ul>
    </div>
  );
}
