"use client"

import Link from 'next/link';
import styles from './navLinks.module.css'
import { usePathname } from 'next/navigation';

const NavLink = ({item, onClick}) => {


    const pathName = usePathname();

    return (
        <Link href={ item.path } className={`${styles.container} ${
            pathName === item.path && styles.active
        }`} onClick={onClick}>
        {item.title}
        </Link>
    )
}

export default NavLink