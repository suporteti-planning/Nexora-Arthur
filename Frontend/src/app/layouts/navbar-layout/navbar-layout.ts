import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar';

@Component({
  selector: 'app-navbar-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './navbar-layout.html',
  styleUrl: './navbar-layout.css'
})
export class NavbarLayout {}