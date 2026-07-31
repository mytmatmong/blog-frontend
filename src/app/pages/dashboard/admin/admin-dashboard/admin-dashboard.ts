import { Component, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

declare var Chart: any;

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements AfterViewInit {
  ngAfterViewInit() {
    this.initCharts();
  }

  initCharts() {
    if (typeof Chart !== 'undefined') {
      // 1. Line Chart - User Growth
      const canvasLine = document.getElementById('userGrowthChart') as HTMLCanvasElement;
      if (canvasLine) {
        new Chart(canvasLine, {
          type: 'line',
          data: {
            labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
            datasets: [{
              label: 'Người dùng mới',
              data: [12, 19, 15, 25, 22, 30, 38],
              borderColor: '#0d6efd',
              backgroundColor: 'rgba(13, 110, 253, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      }

      // 2. Doughnut Chart - Language Allocation
      const canvasPie = document.getElementById('langPieChart') as HTMLCanvasElement;
      if (canvasPie) {
        new Chart(canvasPie, {
          type: 'doughnut',
          data: {
            labels: ['Tiếng Việt', 'Tiếng Anh', 'Ngôn ngữ khác'],
            datasets: [{
              data: [60, 30, 10],
              backgroundColor: ['#0d6efd', '#ffc107', '#6c757d'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            cutout: '70%',
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      }
    }
  }
}
