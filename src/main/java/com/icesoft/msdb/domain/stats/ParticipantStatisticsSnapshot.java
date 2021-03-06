package com.icesoft.msdb.domain.stats;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonIgnore;

public abstract class ParticipantStatisticsSnapshot {

	private Map<String, ParticipantStatistics> categoriesStats = new HashMap<>();
	private Map<String, Map<String, ParticipantStatistics>> yearsCategoriesStats = new HashMap<>();
	
	public List<String> getCategories() {
		List<String> result = categoriesStats.entrySet().parallelStream()
				.map((entry) -> entry.getKey())
				.collect(Collectors.toList());
		
		result.sort((c1, c2) -> c1.compareTo(c2));
		return result;
	}
	
	public List<String> getCategories(String year) {
		List<String> result = yearsCategoriesStats.get(year).entrySet().parallelStream()
				.map((entry) -> entry.getKey())
				.collect(Collectors.toList());
		
		result.sort((c1, c2) -> c1.compareTo(c2));
		return result;
	}
	
	public ParticipantStatistics getStaticsForCategory(String categoryName) {
		return Optional.ofNullable(categoriesStats.get(categoryName)).orElse(new ParticipantStatistics());
	}
	
	public Optional<ParticipantStatistics> getStaticsForCategory(String categoryName, String year) {
		Map<String, ParticipantStatistics> tmp = yearsCategoriesStats.get(year);
		if (tmp == null) {
			tmp = new HashMap<>();
			yearsCategoriesStats.put(year, tmp);
		}
		
		return Optional.ofNullable(tmp.get(categoryName));
	}
	
	public List<String> getYearsStatistics() {
		return yearsCategoriesStats.keySet().stream().sorted((y1, y2) -> y1.compareTo(y2)).collect(Collectors.toList());
	}
	
	public void removeStatisticsOfEvent(Long eventEditionId, String year) {
		categoriesStats.forEach((category, catStats) -> {
			catStats.getResultByEventId(eventEditionId).stream().forEach(result -> catStats.removeResult(result));
		});
		if (yearsCategoriesStats.containsKey(year)) {
			yearsCategoriesStats.get(year).forEach((category, catStats) -> {
				catStats.getResultByEventId(eventEditionId).stream().forEach(result -> catStats.removeResult(result));
			});
		}
	}
	
	@JsonIgnore
	public Map<String, ParticipantStatistics> getStatistics() {
		return categoriesStats;
	}
	
	@JsonIgnore
	public Optional<Map<String, ParticipantStatistics>> getStatisticsYear(String year) {
		return Optional.ofNullable(yearsCategoriesStats.get(year));
	}
	
	public void updateStatistics(String categoryName, ParticipantStatistics stats) {
		categoriesStats.put(categoryName, stats);
	}
	
	public void updateStatistics(String categoryName, ParticipantStatistics stats, String year) {
		Map<String, ParticipantStatistics> catStats = 
				Optional.ofNullable(yearsCategoriesStats.get(year)).orElse(new HashMap<>());
		catStats.put(categoryName, stats);
		yearsCategoriesStats.put(year, catStats);
	}
}
