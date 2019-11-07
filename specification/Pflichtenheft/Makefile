make:
	pdflatex Pflichtenheft.tex -output-format=pdf
	makeglossaries Pflichtenheft
	pdflatex Pflichtenheft.tex -output-format=pdf
	make clean

clean:
	rm -rf  $(TARGET) *.class *.html *.log *.aux *.out *.glo *.glg *.gls *.ist *.xdy *.1 *.toc
