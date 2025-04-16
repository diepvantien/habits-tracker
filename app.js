// Logic để chuyển tab (YEAR/STATS)
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // Thêm logic để hiển thị nội dung tương ứng
    });
});

// Logic để điều hướng năm (PREV/NEXT/TODAY)
document.querySelector('.year-nav button:nth-child(1)').addEventListener('click', () => {
    // Giảm năm
});
document.querySelector('.year-nav button:nth-child(3)').addEventListener('click', () => {
    // Tăng năm
});
document.querySelector('.year-nav button:nth-child(4)').addEventListener('click', () => {
    // Đặt về năm hiện tại
});
