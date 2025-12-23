import 'package:flutter/material.dart';
import "../widget/banner_carousel.dart";
import "../widget/service_card.dart";

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  static const List<Map<String, String>> _listItems = [
    {
      'image': 'assets/images/list1.jpg',
      'title': 'Personal Banking',
      'description': 'Manage your personal accounts with ease'
    },
    {
      'image': 'assets/images/list2.jpg',
      'title': 'Business Banking',
      'description': 'Comprehensive banking solutions for businesses'
    },
    {
      'image': 'assets/images/list3.jpg',
      'title': 'Investment Services',
      'description': 'Grow your wealth with our investment options'
    },
    {
      'image': 'assets/images/list4.jpg',
      'title': 'Loan Services',
      'description': 'Flexible loan options for your needs'
    },
    {
      'image': 'assets/images/list5.jpg',
      'title': 'Digital Banking',
      'description': 'Bank from anywhere with our digital services'
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SBI Bank'),
        backgroundColor: Colors.blue[900],
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Banner Carousel
          const BannerCarousel(),

          // List View
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _listItems.length,
              itemBuilder: (context, index) {
                final item = _listItems[index];
                return ServiceCard(
                  image: item['image']!,
                  title: item['title']!,
                  description: item['description']!,
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}