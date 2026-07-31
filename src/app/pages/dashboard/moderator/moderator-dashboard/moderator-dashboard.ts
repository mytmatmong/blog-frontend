import { Component, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

declare var Chart: any;

@Component({
  selector: 'app-moderator-dashboard',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './moderator-dashboard.html',
  styleUrl: './moderator-dashboard.css',
})
export class ModeratorDashboard implements AfterViewInit {
  ngAfterViewInit() {
    this.initCharts();
  }

  initCharts() {
    if (typeof Chart !== 'undefined') {
      // 1. Bar Chart - Reports
      const canvasBar = document.getElementById('reportsChart') as HTMLCanvasElement;
      if (canvasBar) {
        new Chart(canvasBar, {
          type: 'bar', 
          data: {
            labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
            datasets: [
              {
                label: 'Blog bị báo cáo',
                data: [2, 5, 1, 3, 4, 0, 6],
                backgroundColor: '#0d6efd', 
              },
              {
                label: 'Comment bị báo cáo',
                data: [5, 8, 4, 10, 6, 12, 14],
                backgroundColor: '#ffc107', 
              }
            ]
          },
          options: {
            responsive: true,
            scales: {
              y: { beginAtZero: true, stacked: true },
              x: { stacked: true }
            }
          }
        });
      }

      // 2. Pie Chart - Moderation
      const canvasPie = document.getElementById('moderationPieChart') as HTMLCanvasElement;
      if (canvasPie) {
        new Chart(canvasPie, {
          type: 'pie',
          data: {
            labels: ['Spam', 'Ngôn từ kích động', 'Sai chủ đề'],
            datasets: [{
              data: [45, 25, 30],
              backgroundColor: ['#dc3545', '#ffc107', '#6c757d'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      }
    }
  }
}
